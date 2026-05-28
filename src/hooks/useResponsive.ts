import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    const isSmallDevice = width < 360;
    const isTablet = width >= 768;
    const isLarge = width >= 1024;

    const responsiveFontSize = (size: number) => {
        //Ajuste responsivo
        //Novos ajustes responsivos podem ser feitos aqui.
        if (isTablet) return size * 1.15;
        if (isSmallDevice) return size * 0.95;
        return size;
    };

    return {
        width,
        height,
        isSmallDevice,
        isTablet,
        isLarge,
        responsiveFontSize,
    };
};