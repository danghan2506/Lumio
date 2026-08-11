import React from 'react';

export const View = (props: any) =>
  React.createElement('View', props, props.children);

export const Text = (props: any) =>
  React.createElement('Text', props, props.children);

export const TextInput = (props: any) =>
  React.createElement('TextInput', props, props.children);

export const Pressable = (props: any) =>
  React.createElement('Pressable', props, props.children);

export const ActivityIndicator = (props: any) =>
  React.createElement('ActivityIndicator', props, props.children);

export const Ionicons = (props: any) =>
  React.createElement('Ionicons', props, props.children);

export const FontAwesome5 = (props: any) =>
  React.createElement('FontAwesome5', props, props.children);
