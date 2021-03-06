import "./chat.scss";

import update from "immutability-helper";
import React from "react";
import { useSiteData } from "react-static";
import Balloon, { BalloonSide, IBalloonProps } from "./balloon";
import { Spinner } from "./spinner";
import { pointerHandlerPolyfill } from "./util";

interface IColorData {
    textColor: string;
    balloonColor: string;
}

interface IMessageData extends IColorData {
    tag: "message";
    message: string;
}

interface IInitData extends IColorData {
    tag: "colorData";
}

type Message = IMessageData | IInitData;

enum CommuteState {
    SHOULD_COMMUTE,
    COMMUTED,
    NO_MORE_COMMUTE,
}

interface IState {
    messages: IBalloonProps[];
    growl_down_at?: Date;
    commute_state: CommuteState;
    attend_down_at?: Date;
    intervalId?: any;
    intervalDummy: boolean;
    socket?: WebSocket;
    socket_err?: string;
    balloon_color?: string;
    text_color?: string;
}

const MESSAGE_COUNT = 30;
const GROWL_INTERVAL = 100;

function createGrowl(date: Date) {
    const duration = Math.floor(((new Date()).getTime() - date.getTime()) / GROWL_INTERVAL);
    return "그어" + "어".repeat(duration);
}

class ChatImpl extends React.Component<{SERVER_URL?: string}, IState> {

    public constructor(props: {}, context?: any) {
        super(props, context);

        this.state = {
            commute_state: CommuteState.SHOULD_COMMUTE,
            intervalDummy: false,
            messages: [],
        };
    }

    public componentDidMount() {
        this.connect();
    }

    public componentWillUnmount() {
        this.disconnect();
    }

    public render() {
        if (this.props.SERVER_URL !== undefined) {
            if (this.state.socket_err !== undefined) {
                return <div className="error-msg" onClick={this.onReconnectClick}>
                    Failed to connect to server.<br/>
                    ({ this.state.socket_err })<br/>
                    Click here to retry connection.
                </div>;
            }
            if (this.state.socket === undefined) {
                return <Spinner />;
            }
        }

        const style: React.StyleHTMLAttributes<HTMLDivElement> & any = {};
        if (this.state.balloon_color) {
            style["--my-balloon-color"] = this.state.balloon_color;
        }
        if (this.state.text_color) {
            style["--my-text-color"] = this.state.text_color;
        }
        return <>
            <div className="buttons-wrap" style={style}>
                { this.renderButtonsArea() }
            </div>
            <div className="balloons-wrap" style={style}>
                { this.state.messages.map((prop, idx) => <Balloon key={idx} {...prop} />) }
            </div>
        </>;
    }

    private connect() {
        if (this.props.SERVER_URL === undefined) {
            return;
        }

        if (this.state.socket !== undefined) {
            return;
        }
        this.setState((state) => update(state, {
            socket_err: {
                $set: undefined,
            },
        }));

        try {
            const socket = new WebSocket(this.props.SERVER_URL);
            socket.onopen = () => {
                this.setState((state) => update(state, {
                    socket: {
                        $set: socket,
                    },
                }));
            };
            socket.onerror = () => {
                this.setState((state) => update(state, {
                    socket_err: {
                        $set: "Unknown reason",
                    },
                }));
            };
            socket.onmessage = this.onReceivceMessage;
            socket.onclose = () => this.disconnect();
        } catch (e) {
            const err = e as Error;
            this.setState((state) => update(state, {
                socket_err: {
                    $set: err.message,
                },
            }));
        }
    }
    private disconnect() {
        if (this.state.socket === undefined) {
            return;
        }

        this.state.socket.close(1000, "Client close");
        this.setState((state) => update(state, {
            socket: {
                $set: undefined,
            },
        }));
    }
    private onReconnectClick = () => {
        this.connect();
    }
    private onReceivceMessage = (ev: MessageEvent) => {
        const data = JSON.parse(ev.data) as Message;
        switch (data.tag) {
            case "colorData":
                this.setState((state) => update(state, {
                    balloon_color: {
                        $set: data.balloonColor,
                    },
                    text_color: {
                        $set: data.textColor,
                    },
                }));
                break;
            case "message":
                this.pushMessage(data);
                break;
        }
    }

    private onGrowlDown = () => {
        this.setState({
            growl_down_at: new Date(),
        });
        this.setInterval();
    }
    private onGrowlUp = () => {
        if (this.state.growl_down_at !== undefined) {
            clearInterval(this.state.intervalId);
            const message = createGrowl(this.state.growl_down_at);
            this.sendMessage(message);
            this.pushMessage(message);
            this.setState((state) => update(
                state,
                {
                    growl_down_at: {
                        $set: undefined,
                    },
                    intervalId: {
                        $set: undefined,
                    },
                },
            ));
        }
    }

    private onAttendDown = () => {
        this.setState((state) => update(state, {
            attend_down_at: {
                $set: new Date(),
            },
        }));
        this.setInterval();
    }
    private onAttendUp = () => {
        if (this.state.attend_down_at !== undefined) {
            clearInterval(this.state.intervalId);
            const msg = this.createAttendMessage();
            this.sendMessage(msg);
            this.pushMessage(msg);
            this.setState((state) => update(
                state,
                {
                    attend_down_at: {
                        $set: undefined,
                    },
                    commute_state: {
                        $apply: (v) => {
                            switch (v) {
                                case CommuteState.SHOULD_COMMUTE:
                                    return CommuteState.COMMUTED;
                                case CommuteState.COMMUTED:
                                    return CommuteState.NO_MORE_COMMUTE;
                                case CommuteState.NO_MORE_COMMUTE:
                                    return CommuteState.NO_MORE_COMMUTE;
                            }
                        },
                    },
                    intervalId: {
                        $set: undefined,
                    },
                },
            ));
        }
    }

    private onInterval = () => {
        this.setState((_) => update(this.state, {
            intervalDummy: {
                $apply: (v) => !v,
            },
        }));
    }

    private createAttendMessage() {
        let msg = this.state.commute_state === CommuteState.SHOULD_COMMUTE ? "출" : "퇴";
        if (this.state.attend_down_at !== undefined) {
            const growl = createGrowl(this.state.attend_down_at);
            msg += growl;
        } else {
            msg += "근";
        }

        return msg;
    }

    private setInterval() {
        this.setState((state) => update(state, {
            intervalId: {
                $set: setInterval(this.onInterval, GROWL_INTERVAL),
            },
        }));
    }

    private sendMessage(msg: string) {
        if (this.props.SERVER_URL !== undefined) {
            this.state.socket!.send(msg);
        }
    }

    private pushMessage(msg: string | IMessageData) {
        let newMessage: IBalloonProps;
        if (typeof msg === "string") {
            newMessage = {
                msg,
                side: BalloonSide.Right,
            };
        } else {
            newMessage = {
                msg: msg.message,
                side: BalloonSide.Left,
                text_color: msg.textColor,
                balloon_color: msg.balloonColor,
            };
        }
        this.setState((state) => update(state, {
            messages: {
                $set: [newMessage, ...state.messages.slice(0, MESSAGE_COUNT - 1)],
            },
        }));
    }

    private renderButtonsArea() {
        const ret: JSX.Element[] = [];
        if (this.state.attend_down_at === undefined && this.state.commute_state === CommuteState.COMMUTED) {
            ret.push(<Balloon
                key="growl-previw"
                side={this.state.growl_down_at !== undefined ? BalloonSide.Right : BalloonSide.None}
                msg={createGrowl(this.state.growl_down_at !== undefined ? this.state.growl_down_at : new Date())}
                { ...pointerHandlerPolyfill({
                    onPointerDown: this.onGrowlDown,
                    onPointerLeave: this.onGrowlUp,
                    onPointerUp: this.onGrowlUp,
                }) }
            />);
        }
        if (this.state.growl_down_at === undefined && this.state.commute_state !== CommuteState.NO_MORE_COMMUTE) {
            ret.push(<div
                key="attend-button"
                className="attend block"
                { ...pointerHandlerPolyfill({
                    onPointerDown: this.onAttendDown,
                    onPointerLeave: this.onAttendUp,
                    onPointerUp: this.onAttendUp,
                }) }
            >{ this.createAttendMessage() }</div>);
        }

        return ret;
    }
}

export default () => {
    const SERVER_URL = useSiteData<SiteData>().SERVER_URL;

    return <ChatImpl SERVER_URL={SERVER_URL} />;
};
