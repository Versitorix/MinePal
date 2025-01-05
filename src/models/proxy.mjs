import axios from 'axios';
import { HTTPS_BACKEND_URL } from '../constants.mjs';
const minepal_response_schema = {
    type: "object",
    properties: {
        chat_response: { type: "string" },
        execute_command: { type: "string" }
    },
    required: ["chat_response", "execute_command"],
    additionalProperties: false
};
export class Proxy {
    constructor(model_name) {
        this.model_name = model_name;
        console.log(`Using model: ${model_name}`);
    }

    async sendRequest(turns, systemMessage, stop_seq = '***', memSaving = false) {
        let messages = [{ 'role': 'system', 'content': systemMessage }].concat(turns);
        let res = null;
        // console.log("=== BEGIN MESSAGES ===");
        // messages.forEach((msg, index) => {
        //     console.log(`Message ${index + 1}:`);
        //     console.log(`Role: ${msg.role}`);
        //     console.log(`Content: ${msg.content}`);
        //     console.log("---");
        // });
        // console.log("=== END MESSAGES ===");

        try {
            const requestBody = {
                model_name: this.model_name,
                messages: messages,
                stop_seq: stop_seq,
            };

            if (!memSaving) {
                requestBody.response_format = {
                    type: "json_schema",
                    json_schema: {
                        name: "minepal_response",
                        schema: minepal_response_schema,
                        strict: true
                    }
                };
            }

            const response = await axios.post(`${HTTPS_BACKEND_URL}/openai/chat`, requestBody);
            res = response.data;
        } catch (err) {
            console.error("Request failed:", err);
            res = "My brain disconnected.";
            // if ((err.message.includes('Context length exceeded') || err.response?.status === 500) && turns.length > 1) {
            //     return await this.sendRequest(turns.slice(1), systemMessage, stop_seq, memSaving);
            // } else {
            //     res = 'My brain disconnected, try again.';
            // }
        }
        return res;
    }

    async embed(text) {
        try {
            const response = await axios.post(`${HTTPS_BACKEND_URL}/openai/embed`, {
                model_name: this.model_name,
                text: text,
            });
            return response.data;
        } catch (err) {
            if (err.response && err.response.status === 500) {
                console.log('Error 500:', err.response.data);
            } else {
                console.log('Error:', err.message);
            }
            throw new Error('Failed to get embedding');
        }
    }
}
