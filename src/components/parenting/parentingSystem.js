export const CREATOR_PARENTING_PREVIEW = {
  id: 'creator-parenting-preview',
  release: 'admin-preview',
  enabledForRoles: ['admin'],
  parentGender: 'any',
  children: [
    {
      id: 'creator-adaptive-child',
      relationship: 'adaptive-child',
      displayName: 'Adaptive Child',
      adminModelId: '6aad7cc497402e7ea78b154c',
      adminModelName: 'caieshioa',
      gender: 'female',
      animationName: 'Idle',
      idleOnly: true,
      dashboardOnly: true,
      faceParent: false,
    },
  ],
};

export function canUseCreatorParentingPreview(user) {
  return CREATOR_PARENTING_PREVIEW.enabledForRoles.includes(String(user?.role || '').toLowerCase());
}

function normalize(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function searchableModelText(model) {
  const tags = Array.isArray(model?.tags) ? model.tags.join(' ') : model?.tags;
  return [
    model?.name,
    model?.description,
    model?.category,
    tags,
    model?.file_url,
  ].filter(Boolean).join(' ');
}

export function findCreatorChildModel(models = [], child = CREATOR_PARENTING_PREVIEW.children[0]) {
  if (!Array.isArray(models) || !child) return null;

  if (child.adminModelId) {
    const byId = models.find((model) => model?.id === child.adminModelId && model?.file_url);
    if (byId) return byId;
  }

  const wanted = normalize(child.adminModelName);
  if (!wanted) return null;

  const exact = models.find((model) => normalize(model?.name) === wanted && model?.file_url);
  if (exact) return exact;

  const titleMatch = models.find((model) => normalize(model?.name).includes(wanted) && model?.file_url);
  if (titleMatch) return titleMatch;

  return models.find((model) => normalize(searchableModelText(model)).includes(wanted) && model?.file_url) || null;
}

export function findCreatorChildAnimation(animations = [], child = CREATOR_PARENTING_PREVIEW.children[0]) {
  if (!Array.isArray(animations) || !child) return null;

  const wanted = normalize(child.animationName || 'AFK');
  const candidates = animations.filter((animation) => animation?.file_url);

  return candidates.find((animation) => normalize(animation?.name) === wanted)
    || candidates.find((animation) => normalize(animation?.name).includes(wanted))
    || candidates.find((animation) => normalize(String(animation?.name || '') + ' ' + normalize(animation?.tags || '') + ' ' + String(animation?.folder || '')).includes(wanted))
    || null;
}