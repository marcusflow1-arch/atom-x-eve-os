export type EditInteractionState = {
  editMode: boolean;
  gameplayControlsEnabled: boolean;
  playerMovementEnabled: boolean;
  combatEnabled: boolean;
  targetingEnabled: boolean;
  selectedObjectId: string | null;
};

/**
 * Edit mode owns pointer/input priority. Gameplay is not destroyed or unloaded;
 * it is simply prevented from consuming inputs while the editor owns them.
 */
export class EditInteractionController {
  private state: EditInteractionState = {
    editMode: false,
    gameplayControlsEnabled: true,
    playerMovementEnabled: true,
    combatEnabled: true,
    targetingEnabled: true,
    selectedObjectId: null,
  };

  enterEditMode(): void {
    this.state.editMode = true;
    // Editing is the default priority: don't accidentally attack/target while selecting.
    this.state.gameplayControlsEnabled = false;
    this.state.combatEnabled = false;
    this.state.targetingEnabled = false;
  }

  exitEditMode(): void {
    this.state.editMode = false;
    this.state.gameplayControlsEnabled = true;
    this.state.combatEnabled = true;
    this.state.targetingEnabled = true;
    this.state.selectedObjectId = null;
  }

  setGameplayControlsEnabled(enabled: boolean): void {
    this.state.gameplayControlsEnabled = enabled;
    this.state.combatEnabled = enabled;
    this.state.targetingEnabled = enabled;
  }

  setPlayerMovementEnabled(enabled: boolean): void {
    this.state.playerMovementEnabled = enabled;
  }

  selectObject(objectId: string | null): void {
    this.state.selectedObjectId = objectId;
  }

  getState(): EditInteractionState {
    return { ...this.state };
  }

  /** True when editor input must consume the interaction instead of gameplay. */
  shouldEditorOwnPointer(): boolean {
    return this.state.editMode;
  }

  /** Gameplay systems call this before processing attack/target/block/ability input. */
  shouldGameplayConsumeInput(): boolean {
    return !this.state.editMode || this.state.gameplayControlsEnabled;
  }
}
