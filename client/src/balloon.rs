use std::ops::Add;
use yew::{html, Component, ComponentLink, Html, Renderable, ShouldRender};

#[derive(PartialEq, Clone)]
pub enum BalloonSide {
    Left,
    Right,
}

pub enum Msg {}

#[derive(PartialEq, Clone)]
pub struct Props {
    pub msg: String,
    pub side: BalloonSide,
}

impl Default for Props {
    fn default() -> Self {
        Props {
            msg: "".to_string(),
            side: BalloonSide::Left,
        }
    }
}

pub struct Balloon {
    pub props: Props,
}

impl Component for Balloon {
    type Message = Msg;
    type Properties = Props;

    fn create(props: Self::Properties, _: ComponentLink<Self>) -> Self {
        Balloon { props: props }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        true
    }

    fn change(&mut self, new_props: Self::Properties) -> ShouldRender {
        if self.props != new_props {
            self.props = new_props;
            true
        } else {
            false
        }
    }
}

impl Renderable<Balloon> for Balloon {
    fn view(&self) -> Html<Self> {
        let class_side = match self.props.side {
            BalloonSide::Left => "left",
            BalloonSide::Right => "right",
        };

        html! {
            <div class=String::from("balloon ").add(class_side), >
                <div class="block", >
                    { &self.props.msg }
                </div>
            </div>
        }
    }
}
