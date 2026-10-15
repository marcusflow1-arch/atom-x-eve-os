import React from "react";
import { createRoot } from "react-dom/client";
import Game5Systems from "../../src/game5/client/Game5Systems.jsx";
createRoot(document.getElementById("root")).render(
  <Game5Systems onBack={() => location.reload()} />,
);
