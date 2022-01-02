import { defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';

export const setDeadlineSignal = defineSignal<[number]>('setDeadline');
export const timeLeftQuery = defineQuery<number>('timeLeft');

// @@@SNIPSTART typescript-updatable-timer-impl
// usage
export async function countdownWorkflow(): Promise<void> {
  const target = Date.now() + 24 * 60 * 60 * 1000; // 1 day!!!
  const timer = new UpdatableTimer(target);
  console.log('timer set for: ' + new Date(target).toString());
  setHandler(setDeadlineSignal, (deadline) => {
    // send in new deadlines via Signal
    timer.deadline = deadline;
    console.log('timer now set for: ' + new Date(deadline).toString());
  });
  setHandler(timeLeftQuery, () => timer.deadline - Date.now());
  await timer; // if you send in a signal with a new time, this timer will resolve earlier!
  console.log('countdown done!');
}