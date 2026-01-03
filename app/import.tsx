import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import {
  importLegacyData,
  parseLegacyBackup,
  getImportPreview,
  type ImportPreview,
  type LegacyBackupData,
} from "@/db/import";
import { useSQLiteContext } from "@/db/provider";
import { queryKeys } from "@/db/hooks";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "preview"; data: LegacyBackupData; preview: ImportPreview }
  | { status: "importing" }
  | {
      status: "success";
      accountsImported: number;
      transactionsImported: number;
    }
  | { status: "error"; message: string };

export default function ImportScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  const [state, setState] = useState<ImportState>({ status: "idle" });

  const handleSelectFile = async () => {
    try {
      setState({ status: "loading" });

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setState({ status: "idle" });
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        setState({ status: "error", message: "Could not read file" });
        return;
      }

      // Read file contents
      const fileHandle = new File(file.uri);
      const contents = await fileHandle.text();

      // Parse and validate
      const data = parseLegacyBackup(contents);
      const preview = getImportPreview(data);

      setState({ status: "preview", data, preview });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to read backup file";
      setState({ status: "error", message });
    }
  };

  const handleImport = async () => {
    if (state.status !== "preview") return;

    try {
      setState({ status: "importing" });

      const result = await importLegacyData(db, state.data);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      await queryClient.invalidateQueries({ queryKey: queryKeys.totalBalance });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });

      setState({
        status: "success",
        accountsImported: result.accountsImported,
        transactionsImported: result.transactionsImported,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import data";
      setState({ status: "error", message });
    }
  };

  const handleDone = () => {
    router.back();
  };

  const handleTryAgain = () => {
    setState({ status: "idle" });
  };

  return (
    <>
      <Stack.Header
        style={{
          backgroundColor: colors.backgroundTertiary,
        }}
      >
        <Stack.Header.Left>
          <Stack.Header.Button icon="xmark" onPress={() => router.back()} />
        </Stack.Header.Left>
        <Stack.Header.Title style={{ color: colors.labelPrimary }}>
          Import Backup
        </Stack.Header.Title>
      </Stack.Header>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        {state.status === "idle" && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <SymbolView
              name="doc.badge.arrow.up"
              tintColor={colors.blue}
              size={64}
            />
            <Text
              variant="title2Emphasized"
              style={{ textAlign: "center", marginTop: spacing.md }}
            >
              Import from Grow
            </Text>
            <Text
              variant="bodyRegular"
              color="labelVibrantSecondary"
              style={{ textAlign: "center", paddingHorizontal: spacing.xl }}
            >
              Select a backup file (.db.json) from the previous version of the
              app to import your accounts and transactions.
            </Text>
            <PressableGlass
              onPress={handleSelectFile}
              glassProps={{
                style: {
                  borderRadius: radius.xxl,
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.xl,
                  marginTop: spacing.lg,
                },
                tintColor: colors.blue,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <SymbolView name="folder" tintColor={colors.white} size={20} />
                <Text variant="bodyEmphasized" color="white">
                  Select File
                </Text>
              </View>
            </PressableGlass>
          </View>
        )}

        {state.status === "loading" && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <ActivityIndicator size="large" color={colors.blue} />
            <Text variant="bodyRegular" color="labelVibrantSecondary">
              Reading file...
            </Text>
          </View>
        )}

        {state.status === "preview" && (
          <View style={{ flex: 1, gap: spacing.xl }}>
            <View style={{ alignItems: "center", gap: spacing.sm }}>
              <SymbolView
                name="checkmark.circle.fill"
                tintColor={colors.green}
                size={48}
              />
              <Text variant="title3Emphasized">Ready to Import</Text>
            </View>

            <View
              style={{
                backgroundColor: colors.fillTertiary,
                borderRadius: radius.xxl,
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="bodyRegular" color="labelVibrantSecondary">
                  Accounts
                </Text>
                <Text variant="bodyEmphasized">
                  {state.preview.accountCount}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="bodyRegular" color="labelVibrantSecondary">
                  Transactions
                </Text>
                <Text variant="bodyEmphasized">
                  {state.preview.transactionCount}
                </Text>
              </View>
            </View>

            <View style={{ gap: spacing.md }}>
              <Text
                variant="caption1Emphasized"
                color="labelVibrantSecondary"
                style={{ paddingLeft: spacing.md }}
              >
                ACCOUNTS TO IMPORT
              </Text>
              {state.preview.accounts.map((account, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.fillTertiary,
                    borderRadius: radius.xl,
                    padding: spacing.lg,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text variant="bodyEmphasized">{account.name}</Text>
                    {account.hasGoal && account.goalAmount && (
                      <Text
                        variant="caption1Regular"
                        color="labelVibrantSecondary"
                      >
                        Goal: {formatCurrency(account.goalAmount)}
                      </Text>
                    )}
                  </View>
                  <Text variant="bodyRegular" color="labelVibrantSecondary">
                    {formatCurrency(account.balance)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: "auto", gap: spacing.md }}>
              <PressableGlass
                onPress={handleImport}
                glassProps={{
                  style: {
                    borderRadius: radius.xxl,
                    paddingVertical: spacing.lg,
                    alignItems: "center",
                  },
                  tintColor: colors.blue,
                }}
              >
                <Text variant="bodyEmphasized" color="white">
                  Import {state.preview.accountCount} Account
                  {state.preview.accountCount !== 1 ? "s" : ""}
                </Text>
              </PressableGlass>
              <PressableGlass
                onPress={handleTryAgain}
                glassProps={{
                  style: {
                    borderRadius: radius.xxl,
                    paddingVertical: spacing.lg,
                    alignItems: "center",
                  },
                }}
              >
                <Text variant="bodyEmphasized" color="labelVibrantSecondary">
                  Select Different File
                </Text>
              </PressableGlass>
            </View>
          </View>
        )}

        {state.status === "importing" && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <ActivityIndicator size="large" color={colors.blue} />
            <Text variant="bodyRegular" color="labelVibrantSecondary">
              Importing data...
            </Text>
          </View>
        )}

        {state.status === "success" && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <SymbolView
              name="checkmark.circle.fill"
              tintColor={colors.green}
              size={64}
            />
            <Text variant="title2Emphasized" style={{ textAlign: "center" }}>
              Import Complete!
            </Text>
            <Text
              variant="bodyRegular"
              color="labelVibrantSecondary"
              style={{ textAlign: "center" }}
            >
              Successfully imported {state.accountsImported} account
              {state.accountsImported !== 1 ? "s" : ""} and{" "}
              {state.transactionsImported} transaction
              {state.transactionsImported !== 1 ? "s" : ""}.
            </Text>
            <PressableGlass
              onPress={handleDone}
              glassProps={{
                tintColor: colors.blue,
                style: {
                  borderRadius: radius.xxl,
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.xl,
                  marginTop: spacing.lg,
                },
              }}
            >
              <Text variant="bodyEmphasized" color="white">
                Done
              </Text>
            </PressableGlass>
          </View>
        )}

        {state.status === "error" && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <SymbolView
              name="exclamationmark.triangle.fill"
              tintColor={colors.red}
              size={64}
            />
            <Text variant="title2Emphasized" style={{ textAlign: "center" }}>
              Import Failed
            </Text>
            <Text
              variant="bodyRegular"
              color="labelVibrantSecondary"
              style={{ textAlign: "center", paddingHorizontal: spacing.xl }}
            >
              {state.message}
            </Text>
            <PressableGlass
              onPress={handleTryAgain}
              glassProps={{
                style: {
                  borderRadius: radius.xxl,
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.xl,
                  marginTop: spacing.lg,
                },
              }}
            >
              <Text variant="bodyEmphasized" color="blue">
                Try Again
              </Text>
            </PressableGlass>
          </View>
        )}
      </ScrollView>
    </>
  );
}
