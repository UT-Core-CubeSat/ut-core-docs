import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useHistory} from '@docusaurus/router';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import {
  VIEW, LINKS, SPACECRAFT, BUS, EXTERNALS, BOARDS, BOARD_SIZE, ROW_Y, RADIO,
} from './data';
import styles from './styles.module.css';

const LINK_NAMES = {
  can: 'CAN bus', cdh: 'CDH', eps: 'EPS', adcs: 'ADCS', comms: 'COMMS', gnss: 'GNSS', motor: 'MOTOR', solar: 'SOLAR',
};

/** SVG link that navigates inside the Docusaurus app instead of reloading. */
function DrillLink({to, label, children}) {
  const history = useHistory();
  const {withBaseUrl} = useBaseUrlUtils();
  if (!to) return <g>{children}</g>;
  const href = withBaseUrl(to);
  return (
    <a
      href={href}
      className={styles.drill}
      aria-label={`Open the ${label} page`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        history.push(href);
      }}>
      {children}
    </a>
  );
}

const boardBox = (b) => ({x: b.x, y: ROW_Y[b.side], w: BOARD_SIZE.w, h: BOARD_SIZE.h});

function Board({board}) {
  const {id, title, node, role, planned, main} = board;
  const {x, y, w, h} = boardBox(board);
  return (
    <DrillLink to={LINKS[id]} label={title}>
      <rect
        className={clsx(styles.card, main && styles.main, planned && styles.planned, LINKS[id] && styles.linked)}
        x={x} y={y} width={w} height={h} rx={8}
      />
      <text className={clsx(styles.title, main && styles.titleMain)} x={x + 16} y={y + 36}>{title}</text>
      <text className={styles.node} x={x + w - 14} y={y + 36} textAnchor="end">{node}</text>
      <text className={styles.role} x={x + 16} y={y + 60}>{role}</text>
      {LINKS[id] && <text className={styles.open} x={x + w - 14} y={y + h - 12} textAnchor="end">open ›</text>}
    </DrillLink>
  );
}

function Radio({link}) {
  const ext = EXTERNALS.find((e) => e.id === link.from || e.id === link.to);
  const board = BOARDS.find((b) => b.id === link.from || b.id === link.to);
  const top = ext.y + ext.h;
  const bottom = ROW_Y[board.side];
  const down = link.from === ext.id;
  const marker = `url(#sa-arrow-${link.kind})`;
  const labelX = link.labelLeft ? link.x - 8 : link.x + 8;
  const anchor = link.labelLeft ? 'end' : 'start';
  return (
    <g>
      <line
        className={clsx(styles.link, styles[link.kind])}
        x1={link.x} y1={down ? top : bottom} x2={link.x} y2={down ? bottom : top}
        markerEnd={marker} markerStart={link.both ? marker : undefined}
      />
      <text className={styles.linkLabel} x={labelX} y={128} textAnchor={anchor}>{link.label}</text>
      <text className={styles.linkSub} x={labelX} y={143} textAnchor={anchor}>{link.sub}</text>
    </g>
  );
}

export default function SystemArchitecture() {
  return (
    <div className={styles.root}>
      <figure className={styles.figure}>
        <div className={styles.scroll}>
          <svg className={styles.svg} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img"
            aria-label="UT-CORE block diagram. GNSS, COMMS, CDH, star tracker, ADCS, MOTOR, SOLAR and EPS all connect to one CAN bus. COMMS talks to the ground station over UHF and sends images over S-band. GNSS receives satellite signals.">
            <defs>
              {['uhf', 'rf'].map((k) => (
                <marker key={k} id={`sa-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path className={styles[`m_${k}`]} d="M0,0 L10,5 L0,10 Z" />
                </marker>
              ))}
            </defs>

            <rect className={styles.spacecraft} x={SPACECRAFT.x} y={SPACECRAFT.y}
              width={SPACECRAFT.w} height={SPACECRAFT.h} rx={14} />
            <text className={styles.spacecraftLabel} x={SPACECRAFT.x + SPACECRAFT.w - 14} y={SPACECRAFT.y + 22}
              textAnchor="end">UT-CORE spacecraft</text>

            <DrillLink to={LINKS.can} label="CAN bus">
              <g className={styles.busGroup}>
                {BOARDS.map((b) => {
                  const {x, y, w, h} = boardBox(b);
                  const cx = x + w / 2;
                  return (
                    <line key={b.id} className={clsx(styles.tap, b.planned && styles.planned)}
                      x1={cx} y1={b.side === 'top' ? y + h : y} x2={cx} y2={BUS.y} />
                  );
                })}
                <line className={styles.busHit} x1={BUS.x1} y1={BUS.y} x2={BUS.x2} y2={BUS.y} />
                <line className={styles.bus} x1={BUS.x1} y1={BUS.y} x2={BUS.x2} y2={BUS.y} />
                <text className={styles.busLabel} x={(BUS.x1 + BUS.x2) / 2 - 2} y={BUS.y - 10} textAnchor="middle">
                  CAN BUS · 500 kbit/s · 29-bit IDs
                </text>
              </g>
            </DrillLink>

            {RADIO.map((r) => <Radio key={r.id} link={r} />)}

            {EXTERNALS.map((e) => (
              <g key={e.id}>
                <rect className={styles.external} x={e.x} y={e.y} width={e.w} height={e.h} rx={e.h / 2} />
                <text className={styles.extName} x={e.x + e.w / 2} y={e.y + e.h / 2 + 5} textAnchor="middle">{e.name}</text>
              </g>
            ))}

            {BOARDS.map((b) => <Board key={b.id} board={b} />)}
          </svg>
        </div>
        <figcaption className={styles.caption}>
          Every board connects to the shared CAN bus. COMMS is the only board with a ground link. Click a board or
          the CAN bus to open its page.
        </figcaption>
      </figure>

      <div className={styles.legend} aria-label="Legend">
        <span><svg width="34" height="10"><line className={styles.bus} x1="2" y1="5" x2="32" y2="5" /></svg>CAN bus</span>
        <span><svg width="34" height="10"><line className={clsx(styles.link, styles.uhf)} x1="2" y1="5" x2="32" y2="5" /></svg>UHF radio</span>
        <span><svg width="34" height="10"><line className={clsx(styles.link, styles.rf)} x1="2" y1="5" x2="32" y2="5" /></svg>Other RF (S-band, GNSS)</span>
        <span><svg width="22" height="14"><rect className={clsx(styles.card, styles.planned)} x="1" y="1" width="20" height="12" rx="3" /></svg>Dashed: no firmware yet</span>
      </div>

      <nav className={styles.pages} aria-label="Board pages">
        <span className={styles.pagesLabel}>Pages</span>
        {Object.entries(LINKS).filter(([, to]) => to).map(([id, to]) => (
          <Link key={id} to={to}>{LINK_NAMES[id]}</Link>
        ))}
      </nav>
    </div>
  );
}
