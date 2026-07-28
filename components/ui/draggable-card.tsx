'use client';

import { motion } from 'framer-motion';

interface DraggableCardContainerProps {
  className?: string;
  children: React.ReactNode;
}

export function DraggableCardContainer({ className = '', children }: DraggableCardContainerProps) {
  return (
    <div className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface DraggableCardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function DraggableCardBody({ className = '', children }: DraggableCardBodyProps) {
  return (
    <motion.div
      className={`cursor-grab ${className}`}
      drag
      dragConstraints={{ left: -400, right: 400, top: -300, bottom: 300 }}
      dragElastic={0.05}
      whileDrag={{ scale: 1.1, zIndex: 50 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="pointer-events-none relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

export function DraggableCardDemo() {
  const items = [
    {
      title: "Classic White",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
      className: "absolute top-20 left-[15%]",
    },
    {
      title: "Black Edition",
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
      className: "absolute top-40 left-[30%]",
    },
    {
      title: "Graphic Tee",
      image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
      className: "absolute top-10 left-[50%]",
    },
    {
      title: "Striped Pattern",
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
      className: "absolute top-50 left-[65%]",
    },
    {
      title: "Oversized Fit",
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
      className: "absolute top-30 right-[20%]",
    },
    {
      title: "Vintage Wash",
      image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
      className: "absolute top-60 left-[25%]",
    },
    {
      title: "Limited Series",
      image: "https://images.unsplash.com/photo-1578681994508-b8f06c9a3c85?w=600&q=80",
      className: "absolute top-25 left-[45%]",
    },
  ];

  return (
    <DraggableCardContainer className="bg-[#0a0a0a]">
      <p className="absolute text-center text-2xl font-black" style={{ color: 'rgba(245, 242, 235, 0.08)', fontSize: 'clamp(2rem, 8vw, 6rem)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
        W/J
      </p>
      {items.map((item) => (
        <DraggableCardBody key={item.title} className={item.className}>
          <img
            src={item.image}
            alt={item.title}
            className="pointer-events-none relative z-10 h-64 w-64 md:h-80 md:w-80 object-cover rounded-lg shadow-2xl"
          />
          <h3 className="mt-3 text-center text-lg font-bold" style={{ color: '#f5f2eb' }}>
            {item.title}
          </h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  );
}
