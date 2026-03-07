import React from 'react';
import { Paper, Box } from '@mui/material';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => (
  <Paper
    elevation={1}
    sx={{
      p: 2,
      borderRadius: 1,
    }}
    className={className}
  >
    {children}
  </Paper>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className }: CardHeaderProps) => (
  <Box
    sx={{
      mb: 2,
      pb: 1,
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
    className={className}
  >
    {children}
  </Box>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle = ({ children, className }: CardTitleProps) => (
  <h3
    style={{
      margin: 0,
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#1f2937',
    }}
    className={className}
  >
    {children}
  </h3>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => (
  <Box className={className}>{children}</Box>
);
