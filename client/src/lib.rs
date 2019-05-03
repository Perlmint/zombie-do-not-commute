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
    interval: IntervalService,
    _interval_callback: Callback<()>,
    _interval_handle: Option<Box<Task>>,
}

pub enum Msg {
    GrowlDown,
    GrowlUp,
    GrowlInterval,
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
            interval: IntervalService::new(),
            _interval_callback: link.send_back(|_| Msg::GrowlInterval),
            _interval_handle: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::GrowlDown => {
                self.growl_down_at = Some(Date::now());
                let handle = self.interval.spawn(
                    Duration::from_millis(GROWL_INTERVAL as u64),
                    self._interval_callback.clone(),
                );
                self._interval_handle = Some(Box::new(handle));
                true
            }
            Msg::GrowlUp => {
                if let Some(begin) = self.growl_down_at {
                    self.messages.push_front(balloon::Props {
                        msg: create_growl(begin),
                        side: BalloonSide::Right,
                    });
                    self.messages.truncate(MESSAGE_COUNT);
                    self.growl_down_at = None;
                    self._interval_handle = None;
                }
                true
            }
            Msg::GrowlInterval => {
                if  self.growl_down_at == None {
                    self._interval_handle = None;
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

impl Renderable<Main> for Main {
    fn view(&self) -> Html<Self> {
        let current_balloon = if let Some(begin) = self.growl_down_at {
            message_to_html((
                0,
                &balloon::Props {
                    msg: create_growl(begin),
                    side: BalloonSide::Right,
                },
            ))
        } else {
            html! { { "" } }
        };
        html! {
            <div>
                <div class="buttons-wrap", >
                    <div
                        id="growl-button", class="block",
                        onpointerdown=|_| Msg::GrowlDown,
                        onpointerup=|_| Msg::GrowlUp,
                        onpointercancel=|_| Msg::GrowlUp,
                        onpointerleave=|_| Msg::GrowlUp,
                    >{ "그어어" }</div>
                    { current_balloon }
                </div>
                <div class="balloons-wrap", >
                    { for self.messages.iter().enumerate().map(message_to_html) }
                </div>
            </div>
        }
    }
}
