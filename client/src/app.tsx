import React from "react";
import { Root, Routes } from "react-static";

const App = () => {
    return <Root>
        <React.Suspense fallback={<em>Loading...</em>}>
            <Routes />
        </React.Suspense>
    </Root>;
};

export default App;
