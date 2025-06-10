"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ style, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    style={{
      display: 'inline-flex',
      height: '40px',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      backgroundColor: '#f1f5f9',
      padding: '4px',
      color: '#64748b',
      ...style
    }}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ style, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      borderRadius: '4px',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingTop: '6px',
      paddingBottom: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      color: 'inherit',
      ...style
    }}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ style, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    style={{
      marginTop: '8px',
      outline: 'none',
      ...style
    }}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Add CSS for active states
const tabsStyles = `
  [data-state="active"] {
    background-color: white !important;
    color: #1f2937 !important;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = tabsStyles;
  document.head.appendChild(styleElement);
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
