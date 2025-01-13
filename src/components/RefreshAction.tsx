import { Action, Icon } from "@raycast/api";

type RefreshActionProps = {
  onRefresh: () => void;
};

export function RefreshAction({ onRefresh }: RefreshActionProps) {
  return (
    <Action
      icon={Icon.ArrowClockwise}
      title="Refresh Library"
      shortcut={{ modifiers: ["cmd"], key: "r" }}
      onAction={onRefresh}
    />
  );
}
