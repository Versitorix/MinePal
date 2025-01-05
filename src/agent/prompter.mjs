import { mkdirSync, writeFileSync } from 'fs';
import { getCommandDocs } from './commands/index.mjs';
import { getSkillDocs } from './library/index.mjs';
import { stringifyTurns } from '../utils/text.mjs';
import { getCommand } from './commands/index.mjs';

import { Proxy } from '../models/proxy.mjs';
import { GPT } from '../models/gpt.mjs';

export class Prompter {
    constructor(agent) {
        this.agent = agent;
        this.profile = agent.profile

        let name = this.profile.name;
        let chat = this.profile.model;
        if (typeof chat === 'string' || chat instanceof String) {
            chat = { model: chat };
            if (chat.model.includes('gpt'))
                chat.api = 'openai';
            else
                throw new Error('Unknown model:', chat.model);
        }

        console.log('Using chat settings:', chat);

        if (chat.api == 'openai') {
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (openaiApiKey && openaiApiKey.trim() !== '') {
                console.log("!!!!!!! using openai");
                this.chat_model = new GPT(chat.model, openaiApiKey);
            } else {
                console.log("!!!!!!! using proxy");
                this.chat_model = new Proxy(chat.model, chat.url);
            }
        } else {
            throw new Error('Unknown API:', chat.api);
        }

        let embedding = this.profile.embedding;
        if (embedding === undefined) {
            embedding = { api: chat.api };
        }
        else if (typeof embedding === 'string' || embedding instanceof String)
            embedding = { api: embedding };

        console.log('Using embedding settings:', embedding);

        if (embedding.api == 'openai') {
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (openaiApiKey && openaiApiKey.trim() !== '') {
                console.log("!!!!!!! using openai for embeddings");
                this.embedding_model = new GPT(embedding.model, openaiApiKey);
            } else {
                console.log("!!!!!!! using proxy for embeddings");
                this.embedding_model = new Proxy(embedding.model, embedding.url);
            }
        } else {
            this.embedding_model = null;
            console.log('Unknown embedding: ', embedding ? embedding.api : '[NOT SPECIFIED]', '. Using word overlap.');
        }

        mkdirSync(`${this.agent.userDataDir}/bots/${name}`, { recursive: true });
        writeFileSync(`${this.agent.userDataDir}/bots/${name}/last_profile.json`, JSON.stringify(this.profile, null, 4), (err) => {
            if (err) {
                throw err;
            }
            console.log("Copy profile saved.");
        });
    }

    getName() {
        return this.profile.name;
    }

    getInitModes() {
        return this.profile.modes;
    }

    async replaceStrings(prompt, messages, prev_memory = null, to_summarize = [], last_goals = null) {
        prompt = prompt.replaceAll('$NAME', this.agent.name);
        prompt = prompt.replaceAll('$OWNER', this.agent.owner);
        prompt = prompt.replaceAll('$LANGUAGE', this.agent.settings.language);
        prompt = prompt.replaceAll('$PERSONALITY', this.profile.personality);


        if (prompt.includes('$HUD')) {
            const { hudString } = await this.agent.headsUpDisplay();
            prompt = prompt.replaceAll('$HUD', `Your heads up display: \n${hudString}`);
        }

        if (prompt.includes('$COMMAND_DOCS'))
            prompt = prompt.replaceAll('$COMMAND_DOCS', getCommandDocs());
        if (prompt.includes('$CODE_DOCS'))
            prompt = prompt.replaceAll('$CODE_DOCS', getSkillDocs());
        if (prompt.includes('$MEMORY'))
            prompt = prompt.replaceAll('$MEMORY', prev_memory ? prev_memory : 'None.');
        if (prompt.includes('$TO_SUMMARIZE'))
            prompt = prompt.replaceAll('$TO_SUMMARIZE', stringifyTurns(to_summarize));
        if (prompt.includes('$CONVO'))
            prompt = prompt.replaceAll('$CONVO', 'Recent conversation:\n' + stringifyTurns(messages));
        if (prompt.includes('$LAST_GOALS')) {
            let goal_text = '';
            for (let goal in last_goals) {
                if (last_goals[goal])
                    goal_text += `You recently successfully completed the goal ${goal}.\n`
                else
                    goal_text += `You recently failed to complete the goal ${goal}.\n`
            }
            prompt = prompt.replaceAll('$LAST_GOALS', goal_text.trim());
        }
        if (prompt.includes('$BLUEPRINTS')) {
            if (this.agent.npc.constructions) {
                let blueprints = '';
                for (let blueprint in this.agent.npc.constructions) {
                    blueprints += blueprint + ', ';
                }
                prompt = prompt.replaceAll('$BLUEPRINTS', blueprints.slice(0, -2));
            }
        }

        // check if there are any remaining placeholders with syntax $<word>
        let remaining = prompt.match(/\$[A-Z_]+/g);
        if (remaining !== null) {
            console.warn('Unknown prompt placeholders:', remaining.join(', '));
        }

        return prompt;
    }

    async promptConvo(messages) {
        let prompt = this.profile.conversing;
        prompt = await this.replaceStrings(prompt, messages, this.convo_examples);
        let chat_response, execute_command;
        let response = await this.chat_model.sendRequest(messages, prompt);
        if (typeof response === 'string') {
            response = JSON.parse(response);
        }
        ({ chat_response, execute_command } = response);
        console.log('Chat Response:', chat_response);
        console.log('Execute Command:', execute_command);

        if (chat_response === undefined || execute_command === undefined) {
            return "Oops! OpenAI's server took an arrow to the knee. Mind trying that prompt again?";
        }

        if (execute_command && !execute_command.startsWith('!')) {
            execute_command = '!' + execute_command;
        }

        return (chat_response || "On it.") + " " + execute_command;
    }

    async promptMemSaving(prev_mem, to_summarize) {
        let prompt = this.profile.saving_memory;
        prompt = await this.replaceStrings(prompt, null, null, prev_mem, to_summarize);
        return await this.chat_model.sendRequest([], prompt, '***', true);
    }
}
