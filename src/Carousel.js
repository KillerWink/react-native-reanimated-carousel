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
} = Animated;

const currentWidth = new Value(0);
const reset = new Value(-1);

const frfr = (arr) => {
    //console.log(arr);
};

const myProc = proc((arr) => call([arr], frfr));

function scaleDiff(arr, index) {
    const tmp = arr[index];
    return set(currentWidth, tmp);
}

class Carousel extends Component {


    static contextType = CarouselContext;
    constructor(props) {
        super(props);

        this.slideWidths = new Value(React.Children.map(this.props.children, (child, index) => {
            return;
        }));
        this.st = [10, 200, 300];
        this.stf = [0, -110, -110, -110, -110, 0];
        this.cumulative = this.stf.reduce(function(r, a) {
            r.push((r.length && r[r.length - 1] || 0) + a);
            return r;
        }, []);
        console.log(this.cumulative);
        this.dragX = new Value(0);
        this.offsetX = new Value(0);
        this.gestureState = new Value(-1);
        this.currentIndex = new Value(0);
        this.totalItems = new Value(React.Children.count(this.props.children));
        this.velocity = new Value(0);
        this.tet = new Value(0);
        //console.log(this.value);
        this.onLayout = (event, i) => {
            //console.log('here123', Math.round(event.nativeEvent.layout.width*-1));
            // this.currentWidth = new Value(-10);
            //console.log(this);
            //this.slideWidths._value.setValue(event.nativeEvent.layout.width*-1);
            //console.log(this.slideWidths);
            //this.currentWidth.setValue(event.nativeEvent.layout.width*-1);
            //this.setState({slideWidth: e.nativeEvent.layout.width});
            //set(this.currentWidth, 50),
            //tet[i].setValue(Math.round(event.nativeEvent.layout.width*-1));
            //tet[i] = Math.round(event.nativeEvent.layout.width*-1);
            //myProc(Math.round(event.nativeEvent.layout.width*-1));

            //this.props[`a${i}`].setValue(Math.round(event.nativeEvent.layout.width*-1));
            this.st[i+1] = Math.round(event.nativeEvent.layout.width*-1);
            //this.hello = new Value(this.st);
            //set(this.tet, this.hello);
            if(i === 2){
                //console.log('here123', this.st);
                //this.slideWidths.setValue([])
                //this.tet.setValue([0,0,0]);
            }

        }

        //console.log('hello', this.props.a0);

        this.test = (i) => {
            console.log(i);
            //currentWidth.setValue(this.st[i[0]]);

        }

        this.test2 = (arr) => {
            console.log(arr);
        }

        this.onPanGestureEvent = event(
            [{ nativeEvent: {
                velocityX: this.velocity,
                state: this.gestureState,
                translationX: this.dragX
            } }]
        );

        this.setSlideContext = (slide) => {
            const { setActiveSlide } = this.context;
            setActiveSlide(slide[0]);
        };

        const setIndexLeft = cond(
            lessOrEq(this.currentIndex, 0),
            set(this.currentIndex, 0),
            set(this.currentIndex, sub(this.currentIndex, 1)),
        );
        const setIndexRight = cond(
            greaterOrEq(this.currentIndex, sub(this.totalItems, 1)),
            set(this.currentIndex, sub(this.totalItems, 1)),
            set(this.currentIndex, add(this.currentIndex, 1)),
        );

        this.sum = new Value(0);

        const totalledArray = block([
            ...this.stf.map((element, index) =>
                block([
                    set(this.sum, add(this.sum, element))
                ]),
            )
        ]);


        const setArrayOfWidths = block([
            ...this.stf.map((element, index) =>
                block([
                    cond(
                        eq(this.currentIndex, index),
                        set(currentWidth, element)
                    )
                ]),
            )
        ]);

        const goLeft = block([
            setIndexLeft,
            setArrayOfWidths,
            currentWidth,
            set(this.offsetX, currentWidth),
        ]);

        const goRight = block([
            cond(
                lessThan(this.currentIndex, sub(this.totalItems, 1)),
                [
                    setIndexRight,
                    setArrayOfWidths,
                    add(currentWidth, this.offsetX),
                    set(this.offsetX, add(currentWidth, this.offsetX))
                ],
                [
                    set(this.offsetX, this.offsetX)
                ]
            )
        ]);

        const checkIfLeftOrRight = cond(
            greaterThan(this.dragX, 0),
            goLeft,
            goRight,
        );





        const goBackToStart = set(this.offsetX, currentWidth);

        this.testIndex = new Value(0);

        const setIndex = block([
            ...this.cumulative.map((element, index) =>
                block([
                    cond(
                        lessOrEq(sub(add(this.offsetX, this.dragX), this.props.panLimit), element),
                        [set(this.testIndex, index), set(currentWidth, element)]
                    )
                ]),
            )
        ]);

        const checkIfActionNeeded =
            cond(
                eq(this.gestureState, State.END),
                cond(
                    or(
                        greaterOrEq(abs(this.dragX), this.props.panLimit),
                        greaterOrEq(abs(this.velocity), this.props.velocityLimit)
                    ),
                    set(this.offsetX, currentWidth),
                    goBackToStart
                ),
                add(this.offsetX, this.dragX),
            );


        this.transX = cond(
            or(
                eq(this.gestureState, State.ACTIVE),
                eq(this.gestureState, State.BEGAN)
            ),
            [setIndex, add(this.offsetX, this.dragX)],
            runTiming(
                new Clock(),
                add(this.offsetX, this.dragX),
                checkIfActionNeeded,
                this.props.duration,
                this.currentIndex,
                this.setSlideContext
            ),
        );

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
                        { () => call([this.velocity], this.test) }
                    </Animated.Code>
                    <Animated.View style={{
                        transform: [{translateX: this.transX}],
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
