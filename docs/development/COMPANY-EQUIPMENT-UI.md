# Company & Equipment cleanup (0.48.4)

## Screen checks

1. **Company sheet — clearer.** The previous desktop view repeated preparation, morale, background and perk explanations. Those now live in labelled hints. Health, armor condition, injuries, morale value, attributes, talent stars and available advancement actions stay visible. Learned perks use their existing inspect action with an accessible name.
2. **Equipment and stash — clearer.** The narrow equipment column made instructions dominate the page. The column is wider, protection fits four slots on desktop/tablet, and behavior choices share a row. Guidance for attachments, reserves, mounts, remedies, stash slots and recovery sits beside the relevant heading. Item names and fatigue/protection summaries stay visible; inspection, stowing, swapping and filtering use their existing actions. The starter desktop page shrinks from 1913px to 1483px.
3. **Touch and keyboard help — checked.** Hover or keyboard focus previews a hint; clicking/tapping pins it. A second click, outside tap, Escape, scroll or navigation closes it. Tooltips are positioned inside the viewport and include accessible button names, descriptions and expanded state. Help next to preparation checkboxes is outside the label so tapping help never changes automation.

Screenshots captured the actual local app before and after implementation at 1440px desktop, 768px tablet and 390px phone widths. Browser interaction checks covered hover, pinning, keyboard focus, Escape, outside touch dismissal, navigation, checkbox isolation and stash inspection. Both mobile sizes have no horizontal document overflow, and the tapped phone tooltip fits its viewport.

This is a visual and interaction cleanup: no item stats, equipment rules, campaign state or save migration changes. Screenshot checks and browser focus checks do not establish full screen-reader accessibility compliance.
