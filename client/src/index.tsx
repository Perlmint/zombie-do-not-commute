import "./main.scss";

import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import App from "./app";

export default App;

if (typeof document !== "undefined") {
    const target = document.getElementById("root")!;

    const renderMethod = target.hasChildNodes() ? ReactDOM.hydrate : ReactDOM.render;

    const render = (Comp: React.SFC<any>) => {
        renderMethod(
            <AppContainer>
                <Comp />
            </AppContainer>,
            target,
        );
    };

    // Hot Module Replacement
    if (module && module.hot) {
        module.hot.accept("./app", () => {
            render(App);
        });
    }

    // Render!
    render(App);
}
