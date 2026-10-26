import React from 'react';
import clsx from 'clsx';
import DrillLink from '@site/src/components/DrillLink';
import styles from '@site/src/components/InterfaceDiagram/styles.module.css';

/*
 * CDH board-interface diagram. CDH sits in the middle; the boards it talks to
 * sit above and below. Each arrow carries what is exchanged, and the numbered
 * badges tie arrows to the cross-board paths listed on the CDH page.
 *
 * planned: true = not working end to end in ut-core-zephyr yet (drawn dashed).
 * Opcodes match common/can_proto.h and apps/CDH/src/main.c.
 */

const VIEW = {w: 1020, h: 560};
const CDH = {x: 60, y: 262, w: 900, h: 110};
const TOP_Y = 112;
const BOTTOM_Y = 466;
const BOX = {w: 180, h: 56};

const PATH_COLORS = {1: 'p1', 2: 'p2', 3: 'p3', 4: 'p4'};

const BLOCKS = [
  {id: 'ground', x: 420, y: 10, w: 180, h: 42, name: 'Ground station', external: true},
  {id: 'gnss', x: 60, y: TOP_Y, name: 'GNSS', sub: 'node 0x06', to: '/overview/gnss'},
  {id: 'comms', x: 420, y: TOP_Y, name: 'COMMS', sub: 'node 0x03 · no firmware yet', to: '/overview/comms', planned: true},
  {id: 'nodes', x: 760, y: TOP_Y, name: 'Every node', sub: 'broadcast on the CAN bus', to: '/interfaces/can'},
  {id: 'adcs', x: 60, y: BOTTOM_Y, name: 'ADCS', sub: 'node 0x04', to: '/overview/adcs'},
  {id: 'eps', x: 420, y: BOTTOM_Y, name: 'EPS', sub: 'node 0x02', to: '/overview/eps'},
  {id: 'onboard', x: 760, y: BOTTOM_Y, name: 'CDH onboard parts', sub: '6× TMP1xx · watchdog · FRAM', hw: true},
];

/* Vertical arrows. y1 -> y2 is the direction of travel. side = which side the label sits on. */
const top = (x, dir) => (dir === 'in' ? [TOP_Y + BOX.h, CDH.y] : [CDH.y, TOP_Y + BOX.h]);
const bottom = (x, dir) => (dir === 'out' ? [CDH.y + CDH.h, BOTTOM_Y] : [BOTTOM_Y, CDH.y + CDH.h]);

const ARROWS = [
  {x: 510, y: [52, TOP_Y], both: true, kind: 'rf', planned: true, side: 'right', paths: [1, 3],
    lines: ['UHF radio', 'commands ↓ · telemetry ↑']},

  {x: 130, y: top(130, 'out'), side: 'left', paths: [2], lines: ['GET_POS 0x61', 'every 5 s']},
  {x: 170, y: top(170, 'in'), side: 'right', paths: [2], lines: ['GNSS_POS 0x02', 'lat/lon; time planned']},

  {x: 490, y: top(490, 'in'), side: 'left', planned: true, paths: [1], lines: ['Ground commands', '0x40 0x41 0x20 0x60']},
  {x: 530, y: top(530, 'out'), side: 'right', planned: true, paths: [1, 3], lines: ['CMD_ACK, telemetry', 'planned']},

  {x: 830, y: top(830, 'in'), side: 'left', paths: [3], lines: ['HEARTBEAT 0x30', '1 s · health (SOH)']},
  {x: 870, y: top(870, 'out'), side: 'right', paths: [2, 4], lines: ['CDH HEARTBEAT', 'mode, time planned']},

  {x: 150, y: bottom(150, 'out'), side: 'right', planned: true, paths: [2, 4], lines: ['Pointing, target', 'planned']},

  {x: 490, y: bottom(490, 'out'), side: 'left', paths: [1, 4], lines: ['SET_PWR_STATE 0x60', 'load 1–12, on/off']},
  {x: 530, y: bottom(530, 'in'), side: 'right', paths: [1, 4], lines: ['CMD_RESP ok/error', 'battery V/I planned']},

  {x: 830, y: bottom(830, 'in'), kind: 'local', side: 'left', paths: [3], lines: ['Temps · I2C', '6× TMP1xx']},
  {x: 870, y: bottom(870, 'out'), kind: 'local', planned: true, side: 'right', paths: [], lines: ['WDT kick · GPIO', 'FRAM log · SPI']},
];

function Block({b}) {
  const w = b.w ?? BOX.w;
  const h = b.h ?? BOX.h;
  return (
    <DrillLink to={b.to} label={b.name} className={styles.drill}>
      <rect
        className={clsx(styles.block, b.external && styles.external, b.hw && styles.hw, b.planned && styles.planned, b.to && styles.linked)}
        x={b.x} y={b.y} width={w} height={h} rx={b.external ? h / 2 : 8}
      />
      {b.sub ? (
        <>
          <text className={styles.name} x={b.x + w / 2} y={b.y + 24} textAnchor="middle">{b.name}</text>
          <text className={styles.sub} x={b.x + w / 2} y={b.y + 42} textAnchor="middle">{b.sub}</text>
        </>
      ) : (
        <text className={styles.name} x={b.x + w / 2} y={b.y + h / 2 + 5} textAnchor="middle">{b.name}</text>
      )}
    </DrillLink>
  );
}

function Arrow({a}) {
  const [y1, y2] = a.y;
  const kind = a.kind ?? 'can';
  const marker = `url(#cdh-arrow-${kind})`;
  const lx = a.side === 'left' ? a.x - 16 : a.x + 16;
  const anchor = a.side === 'left' ? 'end' : 'start';
  const midY = (Math.min(y1, y2) + Math.max(y1, y2)) / 2;
  const badgeStart = midY - ((a.paths.length - 1) * 18) / 2;
  return (
    <g>
      <line className={clsx(styles.arrow, styles[kind], a.planned && styles.dashed)}
        x1={a.x} y1={y1} x2={a.x} y2={y2} markerEnd={marker} markerStart={a.both ? marker : undefined} />
      <text className={styles.label} x={lx} y={midY - 3} textAnchor={anchor}>{a.lines[0]}</text>
      <text className={styles.labelSub} x={lx} y={midY + 11} textAnchor={anchor}>{a.lines[1]}</text>
      {a.paths.map((p, i) => (
        <g key={p}>
          <circle className={clsx(styles.badge, styles[PATH_COLORS[p]])} cx={a.x} cy={badgeStart + i * 18} r={7.5} />
          <text className={styles.badgeText} x={a.x} y={badgeStart + i * 18 + 3.5} textAnchor="middle">{p}</text>
        </g>
      ))}
    </g>
  );
}

export default function CdhInterfaces() {
  return (
    <figure className={styles.figure}>
      <div className={styles.scroll}>
        <svg className={styles.svg} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img"
          aria-label="CDH interfaces. CDH polls GNSS for position, takes ground commands from COMMS and will send it acknowledgements and telemetry, hears heartbeats and health from every node and broadcasts its own heartbeat, commands EPS load switches and gets a response, will send pointing commands to ADCS, and reads its own temperature sensors over I2C.">
          <defs>
            {['can', 'rf', 'local'].map((k) => (
              <marker key={k} id={`cdh-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path className={styles[`m_${k}`]} d="M0,0 L10,5 L0,10 Z" />
              </marker>
            ))}
          </defs>

          {ARROWS.map((a) => <Arrow key={`${a.x}-${a.y[0]}`} a={a} />)}
          {BLOCKS.map((b) => <Block key={b.id} b={b} />)}

          <rect className={styles.cdh} x={CDH.x} y={CDH.y} width={CDH.w} height={CDH.h} rx={10} />
          <text className={styles.cdhTitle} x={CDH.x + 20} y={CDH.y + 36}>CDH</text>
          <text className={styles.sub} x={CDH.x + 82} y={CDH.y + 36}>node 0x01 · STM32U5 · Zephyr · TCAN3403</text>
          <text className={styles.cdhLine} x={CDH.x + 20} y={CDH.y + 66}>
            <tspan className={styles.cdhKey}>Decides </tspan>
            node liveness · mode · load power · pointing · imaging passes · downlink windows · time
          </text>
          <text className={styles.cdhLine} x={CDH.x + 20} y={CDH.y + 90}>
            <tspan className={styles.cdhKey}>Keeps </tspan>
            node_alive[ ] · gnss_latest · current_mode · onboard temps · telemetry queue (planned)
          </text>
        </svg>
      </div>
      <figcaption className={styles.caption}>
        <span>Solid arrows are implemented in ut-core-zephyr; dashed arrows are planned or only half built.</span>
        <span className={styles.key}>
          <svg width="30" height="10"><line className={clsx(styles.arrow, styles.can)} x1="1" y1="5" x2="29" y2="5" /></svg>CAN
          <svg width="30" height="10"><line className={clsx(styles.arrow, styles.rf)} x1="1" y1="5" x2="29" y2="5" /></svg>UHF radio
          <svg width="30" height="10"><line className={clsx(styles.arrow, styles.local)} x1="1" y1="5" x2="29" y2="5" /></svg>On-board (I2C, GPIO, SPI)
        </span>
        <span>Numbered badges match the cross-board paths below. Click a board to open its page.</span>
      </figcaption>
    </figure>
  );
}
