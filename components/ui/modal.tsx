/**
 * @description
 * This component renders a modal overlay with animated transitions.
 * It uses a React portal to render the modal content on top of the existing DOM.
 * Key features include:
 * - Fade and scale animations using Framer Motion.
 * - An overlay that closes the modal on click.
 * - Prevention of background scrolling when the modal is open.
 *
 * @dependencies
 * - React: For component creation and portal rendering.
 * - react-dom: For creating a portal.
 * - framer-motion: For animations.
 * - @/lib/utils: For the "cn" utility for class name merging.
 *
 * @notes
 * - This implementation uses document.body as the portal container.
 * - Make sure that the modal is used in a client environment.
 */

"use client"

import React, { useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className
}) => {
  useEffect(() => {
    // Prevent background scrolling when modal is open.
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn("rounded bg-white p-6 shadow-lg", className)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export { Modal }
