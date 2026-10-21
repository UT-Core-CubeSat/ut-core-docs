/**
 * Layout and content for the Architecture Overview block diagram.
 *
 * The overview only shows which boards exist and how they connect (CAN bus,
 * UHF, other RF). Per-board functionality belongs on each board's own page.
 * Coordinates are in the SVG's 1000 x 530 viewBox.
 */

export const VIEW = {w: 1000, h: 530};

/** Drill-down targets. null = no page yet (block is drawn but not clickable). */
export const LINKS = {
  can: '/interfaces/can',
  cdh: '/overview/cdh',
  eps: '/overview/eps',
  adcs: '/overview/adcs',
  comms: '/overview/comms',
  gnss: '/overview/gnss',
  motor: '/hardware/boards/motor',
  solar: '/hardware/boards/solar',
  star: null,
};

/** Spacecraft outline and the CAN bus every board taps into. */
export const SPACECRAFT = {x: 16, y: 104, w: 968, h: 412};
export const BUS = {x1: 40, x2: 960, y: 330};

/** Things outside the spacecraft. */
export const EXTERNALS = [
  {id: 'sats', x: 50, y: 20, w: 190, h: 52, name: 'GNSS satellites'},
  {id: 'ground', x: 286, y: 20, w: 190, h: 52, name: 'Ground station'},
];

/** Boards. `side` says whether the board sits above or below the bus. planned = no firmware yet. */
export const BOARDS = [
  {id: 'gnss', side: 'top', x: 50, title: 'GNSS', node: '0x06', role: 'Position and time'},
  {id: 'comms', side: 'top', x: 286, title: 'COMMS', node: '0x03', role: 'Ground link', planned: true},
  {id: 'cdh', side: 'top', x: 522, title: 'CDH', node: '0x01', role: 'Modes, commands, health', main: true},
  {id: 'star', side: 'top', x: 758, title: 'Star tracker', node: '0x07', role: 'Absolute attitude', planned: true},
  {id: 'adcs', side: 'bottom', x: 50, title: 'ADCS', node: '0x04', role: 'Attitude control'},
  {id: 'motor', side: 'bottom', x: 286, title: 'MOTOR', node: '0x05', role: 'Reaction wheels'},
  {id: 'solar', side: 'bottom', x: 522, title: 'SOLAR', node: '0x08', role: 'Magnetorquers'},
  {id: 'eps', side: 'bottom', x: 758, title: 'EPS', node: '0x02', role: 'Power and loads'},
];
export const BOARD_SIZE = {w: 190, h: 84};
export const ROW_Y = {top: 170, bottom: 406};

/** Radio links from outside the spacecraft. kind: uhf | rf. labelLeft puts the label left of the line. */
export const RADIO = [
  {id: 'uhf', kind: 'uhf', both: true, x: 314, from: 'ground', to: 'comms', label: 'UHF', sub: 'commands ↓ · telemetry ↑'},
  {id: 'sband', kind: 'rf', x: 462, from: 'comms', to: 'ground', label: 'S-band', sub: 'images ↑'},
  {id: 'l1', kind: 'rf', x: 145, from: 'sats', to: 'gnss', label: 'GNSS L1', sub: 'satellite signals ↓'},
];
