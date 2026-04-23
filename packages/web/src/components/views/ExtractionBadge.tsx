import Badge from '../common/Badge.js';

interface ExtractionBadgeProps {
  extractionEnabled: boolean;
  deltaEnabled: boolean;
  odataPublished: boolean;
}

export default function ExtractionBadge({ extractionEnabled, deltaEnabled, odataPublished }: ExtractionBadgeProps) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {extractionEnabled && <Badge variant="green">Extraction Ready</Badge>}
      {deltaEnabled && <Badge variant="yellow">Delta Enabled</Badge>}
      {odataPublished && <Badge variant="blue">OData Published</Badge>}
      {!extractionEnabled && !odataPublished && <Badge variant="gray">Not Extraction-Ready</Badge>}
    </span>
  );
}
