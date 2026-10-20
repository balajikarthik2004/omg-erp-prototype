import { useState, type ReactNode } from 'react'
import { MessageSquarePlus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { MakerCheckerNote } from './MakerCheckerNote'

/**
 * The approve / reject bar that sits under every maker-checker panel.
 *
 * The comment box starts collapsed. An always-open textarea cost roughly a
 * third of the panel on a laptop and half of it on a phone, for a field most
 * approvals leave empty — so it opens on request, and Reject opens it for you
 * rather than sitting dead behind a disabled state.
 */
export function DecisionFooter({
  preparedBy,
  block,
  comment,
  onCommentChange,
  approveLabel,
  approveDisabled,
  approveTitle,
  onApprove,
  onReject,
  rejectLabel = 'Reject',
  warning,
  commentHint = 'Required to reject. Optional on approval, but it is kept in the audit trail.',
}: {
  preparedBy: string
  /** Null when the signed-in persona may decide. */
  block: string | null
  comment: string
  onCommentChange: (value: string) => void
  approveLabel: string
  /** Set on top of the maker-checker block, e.g. an unexplained variance. */
  approveDisabled?: boolean
  approveTitle?: string
  onApprove: () => void
  onReject: () => void
  rejectLabel?: string
  warning?: ReactNode
  commentHint?: string
}) {
  const [showComment, setShowComment] = useState(false)
  const hasComment = comment.trim().length >= 5

  return (
    <div className="flex flex-col gap-3">
      <MakerCheckerNote preparedBy={preparedBy} block={block} />
      {warning}

      {showComment ? (
        <Textarea
          label="Comment"
          hint={commentHint}
          placeholder="Why are you approving or rejecting this?"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={2}
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowComment(true)}
          className="inline-flex items-center gap-1.5 self-start rounded-lg py-0.5 text-[13px] font-medium text-navy-600 transition-colors duration-150 hover:text-navy-800 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none"
        >
          <MessageSquarePlus className="size-4" aria-hidden />
          Add a comment
          <span className="font-normal text-stone-500">&middot; required to reject</span>
        </button>
      )}

      <div className="flex items-center gap-2">
        <Button
          fullWidth
          variant="success"
          disabled={Boolean(block) || approveDisabled}
          title={block ?? approveTitle}
          onClick={onApprove}
        >
          {approveLabel}
        </Button>
        <Button
          variant="secondary"
          disabled={Boolean(block)}
          title={block ?? (hasComment ? undefined : 'Add a comment explaining the rejection.')}
          onClick={() => {
            if (!hasComment) {
              setShowComment(true)
              return
            }
            onReject()
          }}
        >
          {rejectLabel}
        </Button>
      </div>
    </div>
  )
}
