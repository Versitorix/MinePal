import { useState, useCallback } from 'react';
import { RouterContext } from './RouterContext';

type RouterProviderProps = React.PropsWithChildren<{
  initialRoute?: string;
}>;

export default function RouterProvider({ initialRoute = "/", children }: RouterProviderProps) {
  const [history, setHistory] = useState([initialRoute])

  const to = useCallback((location: string) => {
    setHistory((currentHistory) => [location, ...currentHistory]);
  }, []);

  const back = useCallback(() => {
    setHistory(([location, ...restHistory]) => {
      if (restHistory.length === 0) {
        return [location]
      }

      return restHistory;
    });
  }, [])

  return (
    <RouterContext.Provider value={{ location: history[0], to, back }}>
      {children}
    </RouterContext.Provider>
  );
}
