import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '../../types/profile';

interface ProfileState {
  profile: Profile | null;
  onboardingComplete: boolean;
}

const initialState: ProfileState = {
  profile: null,
  onboardingComplete: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<Profile>) {
      state.profile = action.payload;
      state.onboardingComplete = true;
    },
    clearProfile(state) {
      state.profile = null;
      state.onboardingComplete = false;
    },
  },
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
