import "./spinner.less";

import React from "react";

export function Spinner() {
    return <div className="spinner-wrap">
        <div className="lds-grid">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <h2>LOADING...</h2>
    </div>;
}
