import React from 'react';
import clsx from 'clsx';
import DrillLink from '@site/src/components/DrillLink';
import styles from '@site/src/components/InterfaceDiagram/styles.module.css';

/*
 * GNSS board-interface diagram. The GNSS board is drawn as a region holding
 * its three parts (Orion B16 receiver, Orion driver, GNSS app); the boards it
 * talks to sit to the right. Numbered badges tie arrows to the cross-board
 * paths listed on the GNSS page.
 *
 * planned: true = not working end to end in ut-core-zephyr yet (drawn dashed).
 * Opcodes match apps/GNSS/src/main.c and common/can_proto.h.
 */

const VIEW = {w: 1020, h: 710};
const REGION = {x: 200, y: 20, w: 320, h: 670};
const APP_RIGHT = 490;
const RIGHT_X = 780;

const PART = {x: 230, w: 260};
const ORION = {...PART, y: 64, h: 60};
const DRIVER = {...PART, y: 194, h: 60};
const APP = {...PART, y: 314, h: 356};

const BLOCKS = [
  {id: 'sats', x: 20, y: 74, w: 140, h: 40, name: 'GNSS satellites', external: true},
  {id: 'cdh', x: RIGHT_X, y: 330, w: 220, h: 190, name: 'CDH', sub: 'node 0x01', to: '/overview/cdh'},
  {id: 'nodes', x: RIGHT_X, y: 550, w: 220, h: 66, name: 'Every node', sub: 'broadcast on the CAN bus', to: '/interfaces/can'},
  {id: 'console', x: RIGHT_X, y: 636, w: 220, h: 40, name: 'Debug console', hw: true},
];

/* Horizontal arrows between the GNSS app and the right column. dir: out = GNSS sends. */
const LINKS = [
  {y: 360, dir: 'out', both: true, paths: [1], lines: ['← GET_POS 0x61 · every 5 s', '→ CMD_RESP 0x61 + GNSS_POS']},
  {y: 405, dir: 'out', paths: [1, 2], lines: ['GNSS_POS 0x02 · lat, lon', 'GNSS_SOH 0x01 · fix, sats']},
  {y: 450, dir: 'in', planned: true, paths: [3], lines: ['SET_UPDATE_RATE 0x62 · Hz', 'CDH never sends it yet']},
  {y: 495, dir: 'out', planned: true, paths: [4], lines: ['time, altitude, velocity', 'planned']},
  {y: 574, dir: 'out', paths: [5], lines: ['HEARTBEAT 0x30 · 1 s']},
  {y: 600, dir: 'in', paths: [], lines: [null, 'CDH heartbeat · logged only']},
  {y: 656, dir: 'out', kind: 'local', paths: [], lines: ['log output · USART3 115200']},
];

/* Vertical arrows inside the GNSS board, plus the RF link from the satellites. */
const INNER = [
  {x: 330, y: [ORION.y + ORION.h, DRIVER.y], kind: 'local', side: 'left', paths: [1, 2, 4], lines: ['UART 115200', '0xA8 nav · ACK']},
  {x: 390, y: [DRIVER.y, ORION.y + ORION.h], kind: 'local', side: 'right', paths: [3], lines: ['UART', 'config commands']},
  {x: 360, y: [DRIVER.y + DRIVER.h, APP.y], kind: 'local', side: 'right', paths: [1, 2, 4], lines: ['nav fix', 'callback · get_nav()']},
];

function Badges({paths, x, y, vertical}) {
  const start = vertical ? y - ((paths.length - 1) * 18) / 2 : x;
  return paths.map((p, i) => {
    const cx = vertical ? x : start + i * 18;
    const cy = vertical ? start + i * 18 : y;
    return (
      <g key={p}>
        <circle className={clsx(styles.badge, styles[`p${p}`])} cx={cx} cy={cy} r={7.5} />
        <text className={styles.badgeText} x={cx} y={cy + 3.5} textAnchor="middle">{p}</text>
      </g>
    );
  });
}

function Block({b}) {
  return (
    <DrillLink to={b.to} label={b.name} className={styles.drill}>
      <rect
        className={clsx(styles.block, b.external && styles.external, b.hw && styles.hw, b.to && styles.linked)}
        x={b.x} y={b.y} width={b.w} height={b.h} rx={b.external ? b.h / 2 : 8}
      />
      {b.sub ? (
        <>
          <text className={styles.name} x={b.x + b.w / 2} y={b.y + 24} textAnchor="middle">{b.name}</text>
          <text className={styles.sub} x={b.x + b.w / 2} y={b.y + 42} textAnchor="middle">{b.sub}</text>
        </>
      ) : (
        <text className={clsx(styles.name, b.external && styles.sub)} x={b.x + b.w / 2} y={b.y + b.h / 2 + 5}
          textAnchor="middle">{b.name}</text>
      )}
    </DrillLink>
  );
}

function Part({p, name, sub, hw, children}) {
  return (
    <g>
      <rect className={clsx(styles.block, hw && styles.hw)} x={p.x} y={p.y} width={p.w} height={p.h} rx={hw ? 2 : 8} />
      <text className={styles.name} x={p.x + 14} y={p.y + 25}>{name}</text>
      <text className={styles.sub} x={p.x + 14} y={p.y + 44}>{sub}</text>
      {children}
    </g>
  );
}

function Link({l}) {
  const kind = l.kind ?? 'can';
  const marker = `url(#gnss-arrow-${kind})`;
  const [x1, x2] = l.dir === 'out' ? [APP_RIGHT, RIGHT_X] : [RIGHT_X, APP_RIGHT];
  const labelX = APP_RIGHT + 14 + l.paths.length * 18;
  return (
    <g>
      <line className={clsx(styles.arrow, styles[kind], l.planned && styles.dashed)}
        x1={x1} y1={l.y} x2={x2} y2={l.y} markerEnd={marker} markerStart={l.both ? marker : undefined} />
      <Badges paths={l.paths} x={APP_RIGHT + 16} y={l.y} />
      {l.lines[0] && <text className={styles.label} x={labelX} y={l.y - 8}>{l.lines[0]}</text>}
      {l.lines[1] && <text className={l.lines[0] ? styles.labelSub : styles.label} x={labelX} y={l.y + 17}>{l.lines[1]}</text>}
    </g>
  );
}

function Inner({a}) {
  const [y1, y2] = a.y;
  const marker = `url(#gnss-arrow-${a.kind})`;
  const mid = (y1 + y2) / 2;
  const lx = a.side === 'left' ? a.x - 16 : a.x + 16;
  const anchor = a.side === 'left' ? 'end' : 'start';
  return (
    <g>
      <line className={clsx(styles.arrow, styles[a.kind])} x1={a.x} y1={y1} x2={a.x} y2={y2} markerEnd={marker} />
      <Badges paths={a.paths} x={a.x} y={mid} vertical />
      <text className={styles.label} x={lx} y={mid - 3} textAnchor={anchor}>{a.lines[0]}</text>
      <text className={styles.labelSub} x={lx} y={mid + 11} textAnchor={anchor}>{a.lines[1]}</text>
    </g>
  );
}

export default function GnssInterfaces() {
  return (
    <figure className={styles.figure}>
      <div className={styles.scroll}>
        <svg className={styles.svg} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img"
          aria-label="GNSS interfaces. Satellite signals reach the Orion B16 receiver, which sends navigation data over UART to the Orion driver; the GNSS app reports position and state of health to CDH over CAN, answers CDH's position requests, broadcasts a heartbeat to every node, and logs to a debug console over USART3.">
          <defs>
            {['can', 'rf', 'local'].map((k) => (
              <marker key={k} id={`gnss-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path className={styles[`m_${k}`]} d="M0,0 L10,5 L0,10 Z" />
              </marker>
            ))}
          </defs>

          <rect className={styles.region} x={REGION.x} y={REGION.y} width={REGION.w} height={REGION.h} rx={12} />
          <text className={styles.regionTitle} x={REGION.x + 16} y={REGION.y + 30}>GNSS board</text>
          <text className={styles.sub} x={REGION.x + 140} y={REGION.y + 30}>node 0x06 · STM32U5 · Zephyr</text>

          {/* RF link from the satellites to the receiver */}
          <line className={clsx(styles.arrow, styles.rf)} x1={160} y1={94} x2={ORION.x} y2={94} markerEnd="url(#gnss-arrow-rf)" />
          <Badges paths={[1, 2, 4]} x={176} y={94} />
          <text className={styles.label} x={90} y={138} textAnchor="middle">L1 RF</text>
          <text className={styles.labelSub} x={90} y={154} textAnchor="middle">90 Ω antenna feed</text>

          <Part p={ORION} name="Orion B16 receiver" sub="GPS + GLONASS · 1 Hz fix" hw />
          <Part p={DRIVER} name="Orion driver" sub="UART ISR → ring buffer → parser" />
          <Part p={APP} name="GNSS app" sub="main loop + CAN RX thread">
            <text className={styles.note} x={APP.x + 14} y={APP.y + 84}>Every 1 s: heartbeat</text>
            <text className={styles.note} x={APP.x + 14} y={APP.y + 106}>Every 5 s: position + health</text>
            <text className={styles.note} x={APP.x + 14} y={APP.y + 128}>On command: reply to CDH</text>
            <text className={styles.sub} x={APP.x + 14} y={APP.y + 170}>Keeps the latest fix:</text>
            <text className={styles.sub} x={APP.x + 14} y={APP.y + 188}>lat, lon, altitude, time,</text>
            <text className={styles.sub} x={APP.x + 14} y={APP.y + 206}>velocity, DOP, satellites</text>
          </Part>

          {INNER.map((a) => <Inner key={`${a.x}-${a.y[0]}`} a={a} />)}
          {LINKS.map((l) => <Link key={l.y} l={l} />)}
          {BLOCKS.map((b) => <Block key={b.id} b={b} />)}
        </svg>
      </div>
      <figcaption className={styles.caption}>
        <span>Solid arrows are implemented in ut-core-zephyr; dashed arrows are planned or only half built.</span>
        <span className={styles.key}>
          <svg width="30" height="10"><line className={clsx(styles.arrow, styles.can)} x1="1" y1="5" x2="29" y2="5" /></svg>CAN
          <svg width="30" height="10"><line className={clsx(styles.arrow, styles.rf)} x1="1" y1="5" x2="29" y2="5" /></svg>Satellite RF
          <svg width="30" height="10"><line className={clsx(styles.arrow, styles.local)} x1="1" y1="5" x2="29" y2="5" /></svg>On-board (UART)
        </span>
        <span>Numbered badges match the cross-board paths below. Click a board to open its page.</span>
      </figcaption>
    </figure>
  );
}
