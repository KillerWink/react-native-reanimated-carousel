import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { CarouselContainer } from './Carousel.style';
import { DEFAULT_PROPS_CAROUSEL } from './config';
import runTiming from './timing';
import { CarouselContext } from './CarouselContext';

const {
    event,
    Value,
    cond,
    eq,
    or,
    set,
    add,
    greaterOrEq,
    greaterThan,
    multiply,
    abs,
    sub,
    block,
    lessOrEq,
    Clock,
    call,
    proc,
    onChange,
    lessThan,
    neq,
    interpolate,
    round,
    divide,
} = Animated;

const currentWidth = new Value(0);
const dragX = new Value(0);
const offsetX = new Value(0);
const velocity = new Value(0);
const gestureState = new Value(-1);
let translationX = new Value(0);

function setTranslationX(cumulative, panLimit, velocityLimit, duration) {

    let testIndex = new Value(0);

    const getScrollBehaviour = cond(
        greaterThan(dragX, 0),
        divide(
            add(offsetX, dragX),
            round(interpolate(abs(velocity), {
                inputRange: [0, 2000],
                outputRange: [1, 2],
                extrapolate: 'clamp',
            })),
        ),
        multiply(
            add(offsetX, dragX),
            round(interpolate(abs(velocity), {
                inputRange: [0, 2000],
                outputRange: [1, 2],
                extrapolate: 'clamp',
            })),
        ),
    );

    const goBackToStart = set(offsetX, currentWidth);

    const setIndex = block([
        ...cumulative.map((element, index) =>
            block([
                cond(
                    lessOrEq(getScrollBehaviour, element),
                    [set(testIndex, index), set(currentWidth, element)]
                )
            ]),
        )
    ]);

    const checkIfActionNeeded =
        cond(
            eq(gestureState, State.END),
            cond(
                or(
                    greaterOrEq(abs(dragX), panLimit),
                    greaterOrEq(abs(velocity), velocityLimit)
                ),
                set(offsetX, currentWidth),
                goBackToStart
            ),
            add(offsetX, dragX),
        );


    return translationX = cond(
        or(
            eq(gestureState, State.ACTIVE),
            eq(gestureState, State.BEGAN)
        ),
        [setIndex, add(offsetX, dragX)],
        runTiming(
            new Clock(),
            add(offsetX, dragX),
            checkIfActionNeeded,
            duration,
            testIndex,
        ),
    );
}


class Carousel extends Component {


    static contextType = CarouselContext;
    constructor(props) {
        super(props);
        this.state = {
            widthArrays: [],
            cumulative: false,
        };
        this.onLayout = this.onLayout.bind(this);
        this.stf = [0, -110, -110, -110, -110, -110, -110, -110, -110, 0];
        this.cumulative = this.stf.reduce(function(r, a) {
            r.push((r.length && r[r.length - 1] || 0) + a);
            return r;
        }, []);
        this.totalItems = new Value(React.Children.count(this.props.children));

        this.test = (i) => {
            console.log(i);
        }

        this.onPanGestureEvent = event(
            [{ nativeEvent: {
                velocityX: velocity,
                state: gestureState,
                translationX: dragX
            } }]
        );

        this.setSlideContext = (slide) => {
            const { setActiveSlide } = this.context;
            setActiveSlide(slide[0]);
        };



    }

    addLayoutValues = () => {
        cumulative = this.state.widthArrays.reduce(function(r, a) {
            r.push((r.length && r[r.length - 1] || 0) + a);
            return r;
        }, []);
        this.setState({ cumulative });
        this.transX = setTranslationX(this.cumulative, this.props.panLimit, this.props.velocityLimit, this.props.duration);
    }

    onLayout = (event, i) => {
        let cumulative;
        this.setState({ widthArrays: [...this.state.widthArrays, event.nativeEvent.layout.width*-1 ] });

        //console.log(cumulative);
    }

    componentDidMount() {
        console.log(this.state.cumulative);
        //this.setState({ cumulative: true });
    }



    render(){
        return (
            <PanGestureHandler
                onGestureEvent={this.onPanGestureEvent}
                onHandlerStateChange={this.onPanGestureEvent}
            >
                <Animated.View style={{
                    width: this.props.width,
                }}>
                    <Animated.Code>
                        { () => call([], this.test) }
                    </Animated.Code>
                    <Animated.View style={{
                        transform: [{translateX: this.state.cumulative ? this.transX : 0}],
                    }}>
                        <CarouselContainer height={this.props.height} width={this.props.width}>
                            { React.Children.map(this.props.children, (child, index) => (
                                <Animated.View onLayout={(event) => this.onLayout(event, index)}>
                                    {child}
                                </Animated.View>
                            ))}
                        </CarouselContainer>
                    </Animated.View>
                </Animated.View>
            </PanGestureHandler>
        );
    }
}

Carousel.defaultProps = {
    height: DEFAULT_PROPS_CAROUSEL.height,
    width: DEFAULT_PROPS_CAROUSEL.width,
    panLimit: DEFAULT_PROPS_CAROUSEL.panLimit,
    velocityLimit: DEFAULT_PROPS_CAROUSEL.velocityLimit,
    duration: DEFAULT_PROPS_CAROUSEL.duration,
};

Carousel.propTypes = {
    children: PropTypes.node,
    height: PropTypes.number,
    width: PropTypes.number,
    panLimit: PropTypes.number,
    velocityLimit: PropTypes.number,
    duration: PropTypes.number,
};

export default Carousel;
