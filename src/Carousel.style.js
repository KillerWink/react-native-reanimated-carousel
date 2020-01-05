import styled from 'styled-components';

export const CarouselContainer = styled.View`
    flex: 1;
    alignItems: center;
    justifyContent: flex-start;
    flexDirection: row;
    width: ${props => props.width}px;
    height: ${props => props.height}px;
`;
