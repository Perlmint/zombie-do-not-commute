import "./main.less";

import update from "immutability-helper";
import React from "react";
import { render } from "react-dom";
import Balloon, { BalloonSide, IBalloonProps } from "./balloon";
import { Spinner } from "./spinner";
import { pointerHandlerPolyfill } from "./util";

interface IState {
    messages: IBalloonProps[];
    growl_down_at?: Date;
    attended: boolean;
    attend_down_at?: Date;
    intervalId?: any;
    intervalDummy: boolean;
    socket?: WebSocket;
    socket_err?: string;
}

const MESSAGE_COUNT = 30;
const GROWL_INTERVAL = 100;

function createGrowl(date: Date) {
    const duration = Math.floor(((new Date()).getTime() - date.getTime()) / GROWL_INTERVAL);
    return "그어" + "어".repeat(duration);
}

class Main extends React.Component<{}, IState> {
    public constructor(props: {}, context?: any) {
        super(props, context);
        this.state = {
            attended: false,
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
        if (SERVER_URL !== undefined) {
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

        return <React.Fragment>
            <div className="buttons-wrap" >
                { this.renderButtonsArea() }
            </div>
            <div className="balloons-wrap" >
                { this.state.messages.map((prop, idx) => <Balloon key={idx} {...prop} />) }
            </div>
        </React.Fragment>;
    }

    private connect() {
        if (SERVER_URL === undefined) {
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
            const socket = new WebSocket(SERVER_URL);
            this.setState((state) => update(state, {
                socket: {
                    $set: socket,
                },
            }));
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
    private onReceivceMessage(_: MessageEvent) {
        // TODO: process message
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
            this.pushMessage(message, BalloonSide.Right);
            if (SERVER_URL !== undefined) {
                this.state.socket!.send(message);
            }
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
            this.pushMessage(this.createAttendMessage(), BalloonSide.Right);
            this.setState((state) => update(
                state,
                {
                    attend_down_at: {
                        $set: undefined,
                    },
                    attended: {
                        $apply: (v) => !v,
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
        let msg = !this.state.attended ? "출" : "퇴";
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

    private pushMessage(msg: string, side: BalloonSide) {
        this.setState((state) => update(state, {
            messages: {
                $set: [{
                    msg, side,
                }, ...state.messages.slice(0, MESSAGE_COUNT - 1)],
            },
        }));
    }

    private renderButtonsArea() {
        const ret: JSX.Element[] = [];
        if (this.state.attend_down_at === undefined && this.state.attended) {
            ret.push(<div
                key="growl-button"
                id="growl-button"
                className="block"
                { ...pointerHandlerPolyfill({
                    onPointerDown: this.onGrowlDown,
                    onPointerLeave: this.onGrowlUp,
                    onPointerUp: this.onGrowlUp,
                }) }
            >그어어</div>);
        }

        if (this.state.growl_down_at !== undefined) {
            ret.push(<Balloon
                key="growl-previw"
                side={BalloonSide.Right}
                msg={createGrowl(this.state.growl_down_at)}
            />);
        } else {
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

render(<Main/>, document.querySelector("#app")!);
