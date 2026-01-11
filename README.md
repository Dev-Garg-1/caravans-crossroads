# Caravan & Crossroads: Dynamic Trade Routes

Caravan & Crossroads is a fast-paced trading and travel game focused on player freedom, real-time control, and meaningful encounters. You begin with a single caravan and explore living trade routes where every trade, passenger, and decision shapes the journey.

It's available on the link - [game-link](https://team-phoenix.itch.io/caravans-crossroads-phoenix)

---

## Table of Contents

- [Overview](#overview)
- [Core Gameplay](#core-gameplay)
  - [1. Player-Controlled Travel](#1-player-controlled-travel)
  - [2. Trade-Centered Gameplay](#2-trade-centered-gameplay)
  - [3. Passenger System](#3-passenger-system)
  - [4. Multiple Vehicles](#4-multiple-vehicles)
  - [5. Rewards & Exploration](#5-rewards--exploration)
  - [6. Risk & Consequences](#6-risk--consequences)
  - [7. Controls & Accessibility](#7-controls--accessibility)
  - [8. Dynamic World & Modes](#8-dynamic-world--modes)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Game Locally](#running-the-game-locally)
  - [Build for Production](#build-for-production)
- [Project Structure](#project-structure)
- [Future Ideas](#future-ideas)
- [License](#license)

---

## Overview

This is not just another caravan-and-crossroads game. Caravan & Crossroads brings together trading, travel, and emergent encounters into one cohesive gameplay loop. Trade doesn’t live in abstract menus; it happens out on the road, through direct movement, interaction, and choice.

Caravan & Crossroads turns a single road into a living marketplace where movement, trade, and choice create unique journeys and lasting consequences.

---

## Core Gameplay

### 1. Player-Controlled Travel

- Drive vehicles with smooth, responsive controls.
- Move freely across roads and crossroads.
- Enter and exit vehicles for direct interaction in the world.
- Use keyboard shortcuts for fast, accessible gameplay.

### 2. Trade-Centered Gameplay

- Trade happens through movement and interaction, not static menus.
- Trade with roadside traders, passengers, and encounter NPCs.
- Prices change based on:
  - Vehicle type  
  - Capacity  
  - Current demand and supply
- Refuse or remove unwanted traders, which affects future trade opportunities.

### 3. Passenger System

- Board and unboard passengers for transport fees.
- Each passenger doubles as a trade opportunity (they may buy, sell, or request goods).
- Full vehicles allow premium pricing and higher profits.
- Trade individually with boarded passengers for micro-decisions on each stop.

### 4. Multiple Vehicles

- Switch between caravan, bike, bus, truck, and train.
- Each vehicle has different:
  - Speed  
  - Capacity  
  - Trade value / economics
- Vehicle choice affects:
  - Encounter types  
  - Trade margins  
  - Travel risk and reward

### 5. Rewards & Exploration

- Collect gold points to boost earnings and unlock better opportunities.
- Find mystery boxes containing random trade goods or bonuses.
- Exploration and route choice are rewarded over “optimal path” grinding.

### 6. Risk & Consequences

- Optional combat or aggressive actions let you remove hostile or unwanted traders.
- Aggressive behavior reduces peaceful trade options and shifts encounter types.
- Player choices have lasting effects on:
  - Trade density
  - Encounter difficulty
  - Overall route economy

### 7. Controls & Accessibility

- Simple shortcut keys for all major actions (movement, trade, boarding, etc.).
- Clean, focused UI built around movement and contextual interaction.
- Designed to be playable with keyboard-first input.

### 8. Dynamic World & Modes

- Trade routes and encounters react to player behavior over time.
- Multiple viable play styles:
  - Peaceful trader
  - Aggressive profiteer
  - Passenger-focused transporter
  - High-risk, high-reward economy runner

---

## Tech Stack

This repository contains the frontend game client.

- **Framework:** React
- **Language:** TypeScript
- **Bundler/Dev Server:** Vite
- **Build Tooling:** Node.js + npm

---

## Getting Started

### Prerequisites

- **Node.js** (recommended: latest LTS)
- **npm** (comes with Node)

### Installation

```bash
npm install