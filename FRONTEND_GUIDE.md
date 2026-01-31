# AI SEO OS - Frontend Guide

## Overview
The AI SEO OS frontend is built for high-fidelity visualization of the AI Swarm's institutional memory and real-time SEO performance.

## Core Architecture
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS with HSL-tailored custom palettes.
- **Components**: Radix-inspired custom primitives.
- **Animations**: Framer Motion for swarm transitions.
- **Charts**: Recharts for performance velocity mapping.

## Key Interfaces

### 1. The Command Center (Layout)
- **Premium Sidebar**: Dynamic navigation with real-time "Swarm Status" heartbeat.
- **Global Header**: Context-aware property selector and system search.

### 2. AI Swarm Chat (`/dashboard/chat`)
- **Real-time Streaming**: Communicates with the Swarm via Server-Sent Events (SSE).
- **Agent Identity**: Visual markers for which specialist is currently processing (Analyst, Auditor, Research, etc.).
- **Markdown Rendering**: Advanced formatting for agent insights including code blocks and tables.

### 3. Intelligence Analytics (`/dashboard/analytics`)
- **Performance Velocity**: Area charts mapping Clicks and Impressions.
- **Memory Intersection**: Charts overlay "Memory Insights" (anomalies detected by the Sleep Cycle engine).
- **Skill Awareness**: Sidebar showing recent skill promotions from the institutional memory.

## Security
- **Middleware Protection**: All `/dashboard` routes are protected via NextAuth.
- **Server Component Shielding**: Redundant server-side session validation in layouts.
- **Edge Compatibility**: CSS and Layout components are optimized for Edge Runtime where applicable.
