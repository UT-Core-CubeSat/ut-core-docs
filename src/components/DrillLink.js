import React from 'react';
import {useHistory} from '@docusaurus/router';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';

/**
 * Link for use inside an inline <svg>: navigates inside the Docusaurus app
 * instead of reloading. With no `to`, renders its children unlinked.
 */
export default function DrillLink({to, label, className, children}) {
  const history = useHistory();
  const {withBaseUrl} = useBaseUrlUtils();
  if (!to) return <g>{children}</g>;
  const href = withBaseUrl(to);
  return (
    <a
      href={href}
      className={className}
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
