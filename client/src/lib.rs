mod balloon;

use balloon::{Balloon, BalloonSide};
use std::collections::VecDeque;
use std::ops::Add;
use std::time::Duration;
use stdweb::web::Date;
use yew::services::{IntervalService, Task};
use yew::{html, Callback, Component, ComponentLink, Html, Renderable, ShouldRender};

pub struct Main {
    messages: VecDeque<balloon::Props>,
    growl_down_at: Option<f64>,
    attended: bool,
    attend_down_at: Option<f64>,
    interval: IntervalService,
    _interval_callback: Callback<()>,
    _interval_handle: Option<Box<Task>>,
}

pub enum Msg {
    GrowlDown,
    GrowlUp,
    Interval,
    AttendDown,
    AttendUp,
}

const MESSAGE_COUNT: usize = 20;
const GROWL_INTERVAL: u32 = 100;

fn create_growl(begin: f64) -> String {
    let duration_secs = ((Date::now() - begin) / GROWL_INTERVAL as f64) as usize;
    String::from("그어").add(&String::from("어").repeat(duration_secs))
}

impl Component for Main {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, mut link: ComponentLink<Self>) -> Self {
        Main {
            messages: VecDeque::with_capacity(MESSAGE_COUNT + 5),
            growl_down_at: None,
            attend_down_at: None,
            attended: false,
            interval: IntervalService::new(),
            _interval_callback: link.send_back(|_| Msg::Interval),
            _interval_handle: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::GrowlDown => {
                self.growl_down_at = Some(Date::now());
                self.set_interval();
                true
            }
            Msg::GrowlUp => {
                if let Some(begin) = self.growl_down_at {
                    self.push_message(create_growl(begin), BalloonSide::Right);
                    self.messages.truncate(MESSAGE_COUNT);
                    self.growl_down_at = None;
                    self._interval_handle = None;
                }
                true
            }
            Msg::Interval => {
                true
            }
            Msg::AttendDown => {
                self.attend_down_at = Some(Date::now());
                self.set_interval();
                true
            }
            Msg::AttendUp => {
                if let Some(_) = self.attend_down_at {
                    self.push_message(self.create_attend_msg(), BalloonSide::Right);
                    self.attend_down_at = None;
                    self._interval_handle = None;
                    self.attended = !self.attended;
                }
                true
            }
        }
    }
}

fn message_to_html((_, msg): (usize, &balloon::Props)) -> Html<Main> {
    html! {
        <Balloon: side={msg.side.clone()}, msg={msg.msg.clone()}, />
    }
}

impl Main {
    fn set_interval(&mut self) {
        let handle = self.interval.spawn(
            Duration::from_millis(GROWL_INTERVAL as u64),
            self._interval_callback.clone(),
        );
        self._interval_handle = Some(Box::new(handle));
    }

    fn push_message(&mut self, msg: String, side: BalloonSide) {
        self.messages.push_front(balloon::Props {
            msg,
            side,
        });
        self.messages.truncate(MESSAGE_COUNT);
    }

    fn create_attend_msg(&self) -> String {
        let mut msg = String::from(if !self.attended { "출" } else { "퇴" });
        if let Some(begin) = self.attend_down_at {
            let growl = create_growl(begin);
            msg.push_str(&growl);
        } else {
            msg.push_str("근");
        }

        msg
    }

    fn render_buttons_area(&self) -> Vec<Html<Main>> {
        let mut ret: Vec<Html<Main>> = Vec::new();

        if self.attend_down_at == None && self.attended {
            ret.push(html! {
                <div
                    id="growl-button", class="block",
                    onpointerdown=|_| Msg::GrowlDown,
                    onpointerup=|_| Msg::GrowlUp,
                    onpointerleave=|_| Msg::GrowlUp,
                    onmousedown=|_| Msg::GrowlDown,
                    onmouseup=|_| Msg::GrowlUp,
                    onmouseleave=|_| Msg::GrowlUp,
                >{ "그어어" }</div>
            });
        }

        if let Some(begin) = self.growl_down_at {
            ret.push(
                message_to_html((
                    0,
                    &balloon::Props {
                        msg: create_growl(begin),
                        side: BalloonSide::Right,
                    },
                ))
            );
        } else {
            ret.push(html! {
                <div
                    class="attend block",
                    onpointerdown=|_| Msg::AttendDown,
                    onpointerup=|_| Msg::AttendUp,
                    onpointerleave=|_| Msg::AttendUp,
                    onmousedown=|_| Msg::AttendDown,
                    onmouseup=|_| Msg::AttendUp,
                    onmouseleave=|_| Msg::AttendUp,
                >{ self.create_attend_msg() }</div>
            })
        };

        ret
    }
}

impl Renderable<Main> for Main {
    fn view(&self) -> Html<Self> {
        html! {
            <div>
                <div class="buttons-wrap", >
                    { for self.render_buttons_area() }
                </div>
                <div class="balloons-wrap", >
                    { for self.messages.iter().enumerate().map(message_to_html) }
                </div>
            </div>
        }
    }
}
