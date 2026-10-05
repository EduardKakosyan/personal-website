export interface AgentRect {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

// Screen-space coordinates keep the guide beside actual DOM evidence across routes and scrolling.
export function agentLayout({
  width,
  height,
  open,
  target,
  landing,
  bubbleHeight,
}: {
  width: number
  height: number
  open: boolean
  target: AgentRect | null
  landing: AgentRect | null
  bubbleHeight: number
}) {
  const mobile = width < 768
  const pointing = !!target && target.bottom > 95 && target.top < height - 100
  const docked = !open && !pointing && !!landing && landing.top > 50 && landing.bottom < height - 65
  let x = width - 142,
    y = height - 154
  if (docked && landing) {
    x = landing.left + landing.width / 2 - 64
    y = landing.top + landing.height / 2 - 64
  } else if (pointing && target) {
    x = mobile ? width - 138 : clamp(target.right + 6, width * 0.55, width - 142)
    y = clamp(target.top + Math.min(target.height * 0.3, 110), 100, height - 150)
  }
  const bubbleWidth = Math.min(350, width - 32)
  const bx = mobile
    ? 16
    : x > bubbleWidth + 36
      ? x - bubbleWidth - 12
      : clamp(x + 132, 16, width - bubbleWidth - 16)
  let by = clamp(y - 45, 90, Math.max(90, height - bubbleHeight - 18))
  if (mobile && open) {
    if (y + 128 + 10 + bubbleHeight < height - 18) by = y + 138
    else if (y - bubbleHeight > 100) by = y - bubbleHeight - 10
    else {
      y = height - 128 - 14
      by = Math.max(80, y - bubbleHeight - 10)
    }
  }
  return {
    x,
    y,
    bubbleX: bx - x,
    bubbleY: by - y,
    docked,
    pointing,
    direction: target && target.left + target.width / 2 > x + 64 ? (1 as const) : (-1 as const),
  }
}
