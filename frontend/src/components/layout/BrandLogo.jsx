import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layers, Wand2 } from 'lucide-react';

export default function BrandLogo({ size = 'md', onClick }) {
  const isSmall = size === 'sm';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Animated Glowing Icon Badge */}
      <div style={{ position: 'relative', width: isSmall ? 34 : 40, height: isSmall ? 34 : 40 }}>
        {/* Rotating outer ambient aura */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4, #ec4899, #7c3aed)',
            opacity: 0.85,
            filter: 'blur(4px)',
          }}
        />

        {/* Center icon badge */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 11,
          background: 'linear-gradient(145deg, #1e1b4b, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Sparkles size={isSmall ? 18 : 22} color="#22d3ee" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.8))' }} />
          </motion.div>
        </div>
      </div>

      {/* Brand Text */}
      <div>
        <div style={{
          fontSize: isSmall ? '0.95rem' : '1.1rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            UI Critic
          </span>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))',
            border: '1px solid rgba(124,58,237,0.4)',
            color: '#38bdf8',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            AI Studio
          </span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
          Auditor & Redesign Suite
        </div>
      </div>
    </div>
  );
}
