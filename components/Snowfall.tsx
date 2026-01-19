
import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [flakes, setFlakes] = useState<any[]>([]);

  useEffect(() => {
    const flakeCount = 50;
    const newFlakes = Array.from({ length: flakeCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      duration: 5 + Math.random() * 10 + 's',
      delay: Math.random() * 5 + 's',
      size: 2 + Math.random() * 4 + 'px'
    }));
    setFlakes(newFlakes);
  }, []);

  return (
    <div className="snow-container">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
            width: flake.size,
            height: flake.size,
            top: '-10px'
          }}
        />
      ))}
    </div>
  );
};

export default Snowfall;
