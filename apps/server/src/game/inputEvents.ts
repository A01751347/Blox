export interface ViewerRef {
  userId: string;
  nickname: string;
}

export type InputEvent =
  | (ViewerRef & { kind: 'chat'; text: string })
  | (ViewerRef & {
      kind: 'gift';
      giftName: string;
      diamondCount: number;
      repeatCount: number;
      repeatEnd: boolean;
      streakable: boolean;
    })
  | (ViewerRef & { kind: 'like'; likeCount: number })
  | (ViewerRef & { kind: 'follow' })
  | (ViewerRef & { kind: 'share' });
