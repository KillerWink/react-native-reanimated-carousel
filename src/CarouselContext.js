import React, { useState } from 'react';

const CarouselContext = React.createContext();

const CarouselProvider = ({children}) => {
    const [activeSlide, setActiveSlide] = useState(0);

    return (
        <CarouselContext.Provider value={{
            activeSlide, setActiveSlide
        }}>
            {children}
        </CarouselContext.Provider>
    );
};

const useCarouselEffect = () => {
    return React.useContext(CarouselContext);
};

export { CarouselContext, CarouselProvider, useCarouselEffect };
