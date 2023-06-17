import { StatsData } from "@/lib/learning";
import { Center, Container, Overlay, Stack, Text } from "@mantine/core";
import React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

interface StatsProps {
  name: string;
  statsData: StatsData;
  disabled?: boolean;
}

export default function Stats({
  name,
  statsData,
  disabled = false,
}: StatsProps) {
  const colorData = [
    {
      label: "Black",
      value: statsData.colorStatData[0],
    },
    {
      label: "White",
      value: statsData.colorStatData[1],
    },
    {
      label: "Blue",
      value: statsData.colorStatData[2],
    },
    {
      label: "Brown",
      value: statsData.colorStatData[3],
    },
    {
      label: "Grey",
      value: statsData.colorStatData[4],
    },
  ];

  const seasonData = [
    {
      label: "Summer",
      value: statsData.seasonStatData[0],
    },
    {
      label: "Fall",
      value: statsData.seasonStatData[1],
    },
    {
      label: "Winter",
      value: statsData.seasonStatData[2],
    },
    {
      label: "Spring",
      value: statsData.seasonStatData[3],
    },
  ];

  const usageData = [
    {
      label: "Casual",
      value: statsData.usageStatData[0],
    },
    {
      label: "Sports",
      value: statsData.usageStatData[1],
    },
    {
      label: "Ethnic",
      value: statsData.usageStatData[2],
    },
    {
      label: "Formal",
      value: statsData.usageStatData[3],
    },
    {
      label: "NA",
      value: statsData.usageStatData[4],
    },
    {
      label: "Party",
      value: statsData.usageStatData[5],
    },
    {
      label: "Smart Casual",
      value: statsData.usageStatData[6],
    },
  ];

  return (
    <Stack style={{ position: "relative" }}>
      {disabled && (
        <Overlay>
          <Center style={{ height: "100%" }}>
            <Text>Not connected</Text>
          </Center>{" "}
        </Overlay>
      )}
      <Center>
        <Text>{name}</Text>
      </Center>
      <Container style={{ width: "400px", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={colorData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <Radar
              name="Color"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Container>
      <Container style={{ width: "400px", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={seasonData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <Radar
              name="Color"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Container>
      <Container style={{ width: "400px", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={usageData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <Radar
              name="Color"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Container>
    </Stack>
  );
}
