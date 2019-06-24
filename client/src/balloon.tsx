import React from "react";

export enum BalloonSide {
    None,
    Left,
    Right,
}

export interface IBalloonProps extends React.HTMLAttributes<HTMLDivElement> {
    msg: string;
    side: BalloonSide;
    balloon_color?: string;
    text_color?: string;
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
        const style: React.StyleHTMLAttributes<HTMLDivElement> & any = {};
        if (this.props.balloon_color) {
            style["--balloon-color"] = this.props.balloon_color;
        }
        if (this.props.text_color) {
            style["--text-color"] = this.props.text_color;
        }

        return <div className={`balloon ${sideStr}`} {...rest} style={style} >
            <div className="block">
                { msg }
            </div>
        </div>;
    }
}
