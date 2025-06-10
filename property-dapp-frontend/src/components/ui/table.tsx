"use client"

import * as React from "react"

function Table({ style, ...props }: React.ComponentProps<"table">) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      overflowX: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <table
        style={{
          width: '100%',
          captionSide: 'bottom',
          fontSize: '14px',
          borderCollapse: 'collapse',
          ...style
        }}
        {...props}
      />
    </div>
  )
}

function TableHeader({ style, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      style={{
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e5e7eb',
        ...style
      }}
      {...props}
    />
  )
}

function TableBody({ style, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      style={{
        ...style
      }}
      {...props}
    />
  )
}

function TableFooter({ style, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      style={{
        backgroundColor: '#f1f5f9',
        borderTop: '1px solid #e5e7eb',
        fontWeight: '500',
        ...style
      }}
      {...props}
    />
  )
}

function TableRow({ style, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      style={{
        borderBottom: '1px solid #f1f5f9',
        transition: 'background-color 0.2s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8fafc';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    />
  )
}

function TableHead({ style, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      style={{
        color: '#374151',
        height: '48px',
        paddingLeft: '16px',
        paddingRight: '16px',
        textAlign: 'left',
        verticalAlign: 'middle',
        fontWeight: '600',
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        ...style
      }}
      {...props}
    />
  )
}

function TableCell({ style, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      style={{
        padding: '16px',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        color: '#6b7280',
        fontSize: '14px',
        ...style
      }}
      {...props}
    />
  )
}

function TableCaption({ style, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      style={{
        color: '#6b7280',
        marginTop: '16px',
        fontSize: '14px',
        ...style
      }}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
