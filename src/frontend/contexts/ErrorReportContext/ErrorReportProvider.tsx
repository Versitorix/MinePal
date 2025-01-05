import { useCallback, useState } from "react";
import { ErrorReportContext } from "./ErrorReportContext";

export default function ErrorReportProvider({ children }: React.PropsWithChildren) {
  const [error, setError] = useState<Error | unknown>()

  const declareError = useCallback((context: string, error: unknown, displayToUser = false) => {
    console.error(`${new Date().toISOString()} - Minepal - ${context}:`, error);
    if (displayToUser) {
      setError(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  return (
    <ErrorReportContext.Provider value={{ error, declareError, clearError }}>
      {children}
    </ErrorReportContext.Provider>
  )
}
