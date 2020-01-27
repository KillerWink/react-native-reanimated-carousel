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
    and,
    set,
    add,
    greaterOrEq,
    greaterThan,
    multiply,
    abs,
    block,
    lessOrEq,
    Clock,
    call,
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
let setIndex = new Value(0);

function test(here) {
    console.log(here);
}

function getScrollBehaviour(scrollSpeed) {
    return multiply(
        dragX,
        interpolate(abs(velocity), {
            inputRange: [0, 1500],
            outputRange: [1, scrollSpeed],
            extrapolate: 'clamp',
        }),
    );
}

function setIndexFromWidthArray(cumulative, canScroll, scrollSpeed) {
    const firstIndexWidth = cumulative[1];
    return block([
        ...cumulative.map((element, index) =>
            block([
                cond(
                    lessOrEq(
                        cond(
                            and(
                                eq(canScroll, 1),
                                greaterThan(abs(dragX), 5),
                            ),
                            add(offsetX, getScrollBehaviour(scrollSpeed)),
                            add(offsetX, dragX)
                        ),
                        cond(
                            and(
                                eq(index, 0),
                                eq(canScroll, 1),
                            ),
                            abs(firstIndexWidth),
                            element,
                        ),
                    ),
                    [set(setIndex, index), set(currentWidth, element)]
                )
            ]),
        )
    ]);
}


function goBackToStart(){
    return set(offsetX, currentWidth);
}

function checkIfFurtherActionNeeded(panLimit, velocityLimit){
    return cond(
        eq(gestureState, State.END),
        cond(
            or(
                greaterOrEq(abs(dragX), panLimit),
                greaterOrEq(abs(velocity), velocityLimit)
            ),
            set(offsetX, currentWidth),
            goBackToStart()
        ),
        add(offsetX, dragX),
    );
}


function setTranslationX(cumulative, panLimit, velocityLimit, duration, canScroll, scrollSpeed) {
    return translationX = cond(
        or(
            eq(gestureState, State.ACTIVE),
            eq(gestureState, State.BEGAN)
        ),
        [setIndexFromWidthArray(cumulative, canScroll, scrollSpeed), add(offsetX, dragX)],
        runTiming(
            new Clock(),
            add(offsetX, dragX),
            checkIfFurtherActionNeeded(panLimit, velocityLimit),
            duration,
        ),
    );
}


class Carousel extends Component {

    static contextType = CarouselContext;
    constructor(props) {
        super(props);
        this.state = {
            widthArrays: [0],
            isLoading: true,
        };
        this.onLayout = this.onLayout.bind(this);
        this.createCumulativeArray = this.createCumulativeArray.bind(this);
        this.withPreviewArray = this.withPreviewArray.bind(this);
        this.addLayoutValues = this.addLayoutValues.bind(this);
        this.totalItems = React.Children.count(this.props.children);

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

    createCumulativeArray = (array) => {
        let cumulative;
        cumulative = this.state.widthArrays.reduce(function(arr, val) {
            arr.push((arr.length && arr[arr.length - 1] || 0) + val);
            return arr;
        }, []);
        console.log(cumulative);
        return cumulative;
    }

    withPreviewArray = (cumulativeArray) => {
        let previewCumulative;
        const { previewAmount } = this.props;
        previewCumulative = cumulativeArray.reduce(function(arr, val) {
            arr.push(val + previewAmount);
            return arr;
        }, []);
        previewCumulative[0] = 0;
        return previewCumulative
    }

    addLayoutValues = () => {
        const {panLimit, velocityLimit, duration, canScroll, scrollSpeed, withPreview} = this.props;
        const cumulativeArray = this.createCumulativeArray(this.state.widthArrays);
        const withPreviewArray = withPreview && this.withPreviewArray(cumulativeArray);
        this.setState({ isLoading: false });
        this.transX = setTranslationX(
            withPreview ? withPreviewArray : cumulativeArray,
            panLimit,
            velocityLimit,
            duration,
            canScroll,
            scrollSpeed,
        );
    };

    onLayout = (event, index) => {
        this.setState({ widthArrays: [...this.state.widthArrays, event.nativeEvent.layout.width*-1 ] });
        if(index+1 === this.totalItems) {
            this.addLayoutValues();
        }
    };


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
                        { () => call([setIndex], this.setSlideContext) }
                    </Animated.Code>
                    <Animated.View style={{
                        transform: [{ translateX: this.state.isLoading ? 0 : this.transX }],
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
