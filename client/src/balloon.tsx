import React from "react";

export enum BalloonSide {
    None,
    Left,
    Right,
}

export interface IBalloonProps extends React.HTMLAttributes<HTMLDivElement> {
    msg: string;
    side: BalloonSide;
}

export default class Balloon extends React.Component<IBalloonProps> {
    public render() {
        const {side, msg, ...rest} = this.props;
        let sideStr = "";
        switch (side) {
            case BalloonSide.Left:
                sideStr = "left";
                break;
            case BalloonSide.Right:
                sideStr = "right";
                break;
        }
        return <div className={`balloon ${sideStr}`} {...rest} >
            <div className="block">
                { msg }
            </div>
        </div>;
    }
}
