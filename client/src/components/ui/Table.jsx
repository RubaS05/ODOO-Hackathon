import React from 'react';
export const Table = React.forwardRef(({ className = '', ...props }, ref) => (<div className="relative w-full overflow-auto rounded-lg border border-border/60 bg-card">
      <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props}/>
    </div>));
Table.displayName = 'Table';
export const TableHeader = React.forwardRef(({ className = '', ...props }, ref) => (<thead ref={ref} className={`bg-muted/40 border-b border-border/60 ${className}`} {...props}/>));
TableHeader.displayName = 'TableHeader';
export const TableBody = React.forwardRef(({ className = '', ...props }, ref) => (<tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props}/>));
TableBody.displayName = 'TableBody';
export const TableRow = React.forwardRef(({ className = '', ...props }, ref) => (<tr ref={ref} className={`border-b border-border/40 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted ${className}`} {...props}/>));
TableRow.displayName = 'TableRow';
export const TableHead = React.forwardRef(({ className = '', ...props }, ref) => (<th ref={ref} className={`h-11 px-4 text-left align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs [&:has([role=checkbox])]:pr-0 ${className}`} {...props}/>));
TableHead.displayName = 'TableHead';
export const TableCell = React.forwardRef(({ className = '', ...props }, ref) => (<td ref={ref} className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}/>));
TableCell.displayName = 'TableCell';
