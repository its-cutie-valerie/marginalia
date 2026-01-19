
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
}

export function Skeleton({ width, height, borderRadius, className = '' }: SkeletonProps) {
    const style = {
        width,
        height,
        borderRadius,
    };

    return <div className={`skeleton ${className}`} style={style} />;
}
