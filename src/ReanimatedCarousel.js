import React from 'react';
import Carousel from './Carousel';
import { CarouselProvider } from './CarouselContext';

const ReanimatedCarousel = ({ options = {}, children }) => {
    console.log(children);
    return (
        <CarouselProvider>
            <Carousel {...options}>
                {children}
            </Carousel>
        </CarouselProvider>
    );
};

export default ReanimatedCarousel;
