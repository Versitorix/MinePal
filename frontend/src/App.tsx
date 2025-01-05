import './App.css';
import UserSettingsProvider from './contexts/UserSettingsContext/UserSettingsProvider';
import AgentProvider from './contexts/AgentContext/AgentProvider';
import ErrorReportProvider from './contexts/ErrorReportContext/ErrorReportProvider';
import RouterProvider from './contexts/RouterContext/RouterProvider';
import Routes from './Routes';

export default function App() {
  return (
    <RouterProvider>
      <ErrorReportProvider>
        <UserSettingsProvider>
          <AgentProvider>
            <Routes />
          </AgentProvider>
        </UserSettingsProvider>
      </ErrorReportProvider>
    </RouterProvider>
  );
}
