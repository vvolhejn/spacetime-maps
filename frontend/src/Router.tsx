import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";

/** The router is only needed so that useSearchParamsState works. */
export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};
