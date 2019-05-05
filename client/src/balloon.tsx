import React from "react";

export enum BalloonSide {
    Left,
    Right,
}

export interface IBalloonProps {
    msg: string;
    side: BalloonSide;
}

export default class Balloon extends React.Component<IBalloonProps> {
    public render() {
        return <div className={`balloon ${this.props.side === BalloonSide.Left ? "left" : "right"}`} >
            <div className="block">
                { this.props.msg }
            </div>
        </div>;
    }
}
